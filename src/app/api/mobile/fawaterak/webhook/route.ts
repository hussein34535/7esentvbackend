import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sql from '@/lib/db';
import { auth, firestore } from '@/lib/firebase-admin';
import { sendUserApprovalNotification } from '@/lib/email';

export async function POST(request: Request) {
    try {
        console.log('--- Fawaterak Webhook Received ---');
        
        let body;
        const bodyText = await request.text();
        try {
            body = JSON.parse(bodyText);
            console.log('Webhook Body (JSON):', JSON.stringify(body));
        } catch (e: any) {
            console.log('Webhook is not JSON, trying URL-encoded...', bodyText);
            try {
                const params = new URLSearchParams(bodyText);
                body = Object.fromEntries(params.entries());
                if (body.payLoad && typeof body.payLoad === 'string') {
                    try { body.payLoad = JSON.parse(body.payLoad); } catch (err) {}
                }
                console.log('Webhook Body (URL-Encoded):', JSON.stringify(body));
            } catch (e2) {
                console.error('Failed to parse webhook JSON or Form body:', e2);
                return NextResponse.json({ success: false, error: 'Invalid request body format' }, { status: 400 });
            }
        }

        const vendorKey = process.env.FAWATERAK_API_KEY;
        if (!vendorKey) {
            console.error('FAWATERAK_API_KEY is not configured on server');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        // Handle possible casing variations in Fawaterak payload
        const hashKey = body.hashKey || body.hash_key;
        const invoiceId = body.invoice_id || body.invoiceId;
        const invoiceKey = body.invoice_key || body.invoiceKey;
        const paymentMethod = body.payment_method || body.paymentMethod;
        const invoiceStatus = body.invoice_status || body.invoiceStatus || body.status;
        const payLoad = body.pay_load || body.payload || body.payLoad;

        if (!hashKey || !invoiceId || !invoiceKey || !paymentMethod) {
            console.warn('Webhook missing signature validation fields');
            return NextResponse.json({ success: false, error: 'Missing signature fields' }, { status: 400 });
        }

        // 1. Verify Hash Signature (HMAC SHA256 using Vendor Key)
        // Format: InvoiceId={invoice_id}&InvoiceKey={invoice_key}&PaymentMethod={payment_method}
        const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoiceKey}&PaymentMethod=${paymentMethod}`;
        const computedHash = crypto
            .createHmac('sha256', vendorKey)
            .update(queryParam)
            .digest('hex');

        console.log(`Computed Hash: ${computedHash} vs Received Hash: ${hashKey}`);

        if (computedHash !== hashKey) {
            console.error('Invalid signature: hashes do not match');
            return NextResponse.json({ success: false, error: 'Invalid HMAC signature' }, { status: 400 });
        }

        console.log('Webhook signature verified successfully!');

        // 2. Process only "paid" status events
        if (invoiceStatus === 'paid' || invoiceStatus === 'success' || invoiceStatus === 'Paid') {
            if (!payLoad || !payLoad.uid || !payLoad.packageId) {
                console.error('Webhook missing transaction payload (uid or packageId)', payLoad);
                return NextResponse.json({ success: false, error: 'Missing metadata payLoad' }, { status: 400 });
            }

            const { uid, packageId } = payLoad;
            console.log(`Processing successful payment for User: ${uid}, Package: ${packageId}`);

            // 3. Fetch package details
            const packageRows = await sql`
                SELECT name, duration_days FROM packages WHERE id = ${packageId}
            `;
            
            if (packageRows.length === 0) {
                console.error(`Package ID ${packageId} not found in database`);
                return NextResponse.json({ success: false, error: 'Package not found' }, { status: 400 });
            }

            const pkg = packageRows[0];
            const durationDays = pkg.duration_days || 30;
            const packageName = pkg.name || 'Premium';

            // 4. Fetch user email
            const userRows = await sql`
                SELECT email FROM users WHERE id = ${uid}
            `;
            let email = userRows[0]?.email;
            
            if (!email) {
                try {
                    const userRecord = await auth.getUser(uid);
                    email = userRecord.email;
                } catch (authErr) {
                    console.error('User not found in Firebase Auth:', authErr);
                    email = 'user@app.com'; // fallback
                }
            }

            // 5. Calculate Subscription End Date (cumulative if already active)
            const currentUser = await sql`SELECT subscription_end FROM users WHERE id = ${uid}`;
            let baseDate = new Date();
            if (currentUser.length > 0 && currentUser[0].subscription_end) {
                const existingEnd = new Date(currentUser[0].subscription_end);
                if (existingEnd > baseDate) {
                    baseDate = existingEnd;
                }
            }
            const endDate = new Date(baseDate);
            endDate.setDate(endDate.getDate() + durationDays);

            // 6. Update PostgreSQL
            await sql`
                INSERT INTO users (id, email, subscription_end, plan_id, status, updated_at)
                VALUES (${uid}, ${email}, ${endDate.toISOString()}, ${packageId}, 'active', now())
                ON CONFLICT (id) 
                DO UPDATE SET 
                    subscription_end = ${endDate.toISOString()},
                    plan_id = ${packageId},
                    status = 'active',
                    updated_at = now()
            `;

            // 7. Sync to Firestore (for mobile app compat)
            await firestore.collection('users').doc(uid).set({
                email: email,
                isSubscribed: true,
                subscriptionEnd: endDate.toISOString(),
                status: 'active',
                lastPaymentTime: new Date().toISOString()
            }, { merge: true });

            // 8. Send Email Notification
            try {
                await sendUserApprovalNotification(email, packageName);
                console.log(`Sent email confirmation to ${email} for package ${packageName}`);
            } catch (mailErr) {
                console.error('Webhook confirmation email failed:', mailErr);
            }

            console.log(`User ${uid} subscription successfully activated until ${endDate.toDateString()}`);
        } else {
            console.log(`Ignored webhook with non-paid status: ${invoiceStatus}`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Fawaterak webhook error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
