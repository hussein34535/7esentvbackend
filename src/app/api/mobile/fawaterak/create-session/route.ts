import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
    try {
        console.log('--- Fawaterak Create Session Started ---');
        
        let body;
        try {
            body = await request.json();
            console.log('Fawaterak request body parsed:', body);
        } catch (e: any) {
            console.error('Failed to parse request JSON:', e);
            return NextResponse.json({ success: false, error: `Invalid request JSON body: ${e.message}` }, { status: 400 });
        }

        const { uid, packageId, paymentMethod, couponCode, email, phone, firstName, lastName } = body;

        if (!uid || !packageId || !paymentMethod) {
            return NextResponse.json({ success: false, error: 'Missing uid, packageId, or paymentMethod' }, { status: 400 });
        }

        // Map paymentMethod ('fawry', 'wallet', or 'card') to Fawaterak payment_method_id
        let paymentMethodId = 3; // default to Fawry
        if (paymentMethod.toLowerCase() === 'wallet' || paymentMethod.toLowerCase() === 'mobile wallet') {
            paymentMethodId = 4; // Mobile Wallet
        } else if (paymentMethod.toLowerCase() === 'fawry') {
            paymentMethodId = 3; // Fawry
        } else if (paymentMethod.toLowerCase() === 'card' || paymentMethod.toLowerCase() === 'credit card' || paymentMethod.toLowerCase() === 'visa') {
            paymentMethodId = 2; // Credit Card / Visa
        } else {
            // Check if user passed number directly
            const parsedId = parseInt(paymentMethod);
            if (!isNaN(parsedId)) {
                paymentMethodId = parsedId;
            }
        }

        const apiToken = process.env.FAWATERAK_API_KEY;
        if (!apiToken) {
            console.error('Fawaterak API token not configured on server');
            return NextResponse.json({ success: false, error: 'Fawaterak credentials not configured on server' }, { status: 500 });
        }

        // 1. Fetch package details from Postgres
        const packageRows = await sql`
            SELECT id, name, price, sale_price 
            FROM packages 
            WHERE id = ${packageId}
        `;
        
        if (packageRows.length === 0) {
            return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
        }
        
        const pkg = packageRows[0];
        const basePrice = (pkg.sale_price && Number(pkg.sale_price) < Number(pkg.price) && Number(pkg.sale_price) > 0)
            ? pkg.sale_price
            : pkg.price;
        let finalPrice = Number(basePrice);

        // 2. Apply coupon discount if applicable
        if (couponCode) {
            const promoRows = await sql`
                SELECT discount_percent, expires_at, is_active, max_uses, used_count
                FROM promo_codes
                WHERE code = ${couponCode}
            `;
            if (promoRows.length > 0) {
                const promo = promoRows[0];
                const now = new Date();
                const isExpired = promo.expires_at && new Date(promo.expires_at) < now;
                const isUnderLimit = promo.max_uses === -1 || promo.used_count < promo.max_uses;
                if (promo.is_active && !isExpired && isUnderLimit) {
                    finalPrice = finalPrice * (1 - promo.discount_percent / 100);
                    console.log(`Applied promo code ${couponCode}. Discount: ${promo.discount_percent}%. Final price: ${finalPrice}`);
                }
            }
        }

        // Formatted price with 2 decimal places as required by Fawaterak
        const formattedPrice = finalPrice.toFixed(2);

        // 3. Fetch user email from database for invoice
        const userRows = await sql`
            SELECT email FROM users WHERE id = ${uid}
        `;
        const dbEmail = userRows[0]?.email;
        const customerEmail = email || dbEmail || 'user@app.com';

        // 4. Construct Fawaterak payload
        const fawaterakPayload = {
            payment_method_id: paymentMethodId,
            cartTotal: formattedPrice,
            currency: 'EGP',
            customer: {
                first_name: firstName || 'User',
                last_name: lastName || 'Name',
                email: customerEmail,
                phone: phone || '01000000000',
                address: 'Cairo, Egypt'
            },
            redirectionUrls: {
                successUrl: 'https://7esentvbackend.vercel.app/api/mobile/fawaterak/callback?status=success',
                failUrl: 'https://7esentvbackend.vercel.app/api/mobile/fawaterak/callback?status=fail',
                pendingUrl: 'https://7esentvbackend.vercel.app/api/mobile/fawaterak/callback?status=pending'
            },
            cartItems: [
                {
                    name: pkg.name || 'Premium Subscription',
                    price: formattedPrice,
                    quantity: '1'
                }
            ],
            // Custom payload that Fawaterak returns in the Webhook
            payLoad: {
                uid: uid,
                packageId: Number(packageId)
            }
        };

        console.log('Sending invoice request to Fawaterak:', JSON.stringify(fawaterakPayload));

        // 5. Call Fawaterak ExecutePayment API
        const baseUrl = process.env.FAWATERAK_BASE_URL || 'https://app.fawaterk.com/api';
        const fawaterakRes = await fetch(`${baseUrl}/v2/invoiceInitPay`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fawaterakPayload)
        });

        const resText = await fawaterakRes.text();
        console.log('Fawaterak Response Status:', fawaterakRes.status, 'Body:', resText);

        let resData;
        try {
            resData = JSON.parse(resText);
        } catch (e: any) {
            throw new Error(`Failed to parse Fawaterak API response: ${resText}. Error: ${e.message}`);
        }

        if (resData.status !== 'success' || !resData.data) {
            let errorMsg = resData.message;
            if (typeof errorMsg === 'object') {
                errorMsg = JSON.stringify(errorMsg);
            }
            throw new Error(`Fawaterak API error: ${errorMsg || resText}`);
        }

        console.log('Fawaterak Invoice Created Successfully!', resData.data);

        return NextResponse.json({
            success: true,
            invoiceId: resData.data.invoice_id,
            invoiceKey: resData.data.invoice_key,
            paymentData: resData.data.payment_data,
            paymentMethod: paymentMethodId === 3 ? 'fawry' : 'wallet'
        });

    } catch (error: any) {
        console.error('Fawaterak session creation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
