import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, packageId, couponCode, email, phone, firstName, lastName } = body;

        if (!uid || !packageId) {
            return NextResponse.json({ success: false, error: 'Missing uid or packageId' }, { status: 400 });
        }

        const apiKey = process.env.PAYMOB_API_KEY;
        const integrationId = process.env.PAYMOB_INTEGRATION_ID;

        if (!apiKey || !integrationId) {
            return NextResponse.json({ success: false, error: 'Paymob credentials not configured on server' }, { status: 500 });
        }

        // 1. Authentication Request
        const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey }),
        });
        const authData = await authRes.json();
        const token = authData.token;

        if (!token) {
            throw new Error('Failed to get auth token from Paymob');
        }

        // 2. Order Registration Request
        // TODO: Map packageId to an actual price amount. Hardcoding 100 EGP for now.
        const amountCents = 10000; 

        const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                delivery_needed: 'false',
                amount_cents: amountCents.toString(),
                currency: 'EGP',
                merchant_order_id: `order_${uid}_${Date.now()}`,
                items: [],
            }),
        });
        const orderData = await orderRes.json();
        const orderId = orderData.id;

        if (!orderId) {
            throw new Error('Failed to create order in Paymob');
        }

        // 3. Payment Key Request
        const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                amount_cents: amountCents.toString(),
                expiration: 3600,
                order_id: orderId,
                billing_data: {
                    apartment: 'NA',
                    email: email || 'test@test.com',
                    floor: 'NA',
                    first_name: firstName || 'User',
                    street: 'NA',
                    building: 'NA',
                    phone_number: phone || '01000000000',
                    shipping_method: 'NA',
                    postal_code: 'NA',
                    city: 'Cairo',
                    country: 'EG',
                    last_name: lastName || 'Name',
                    state: 'NA',
                },
                currency: 'EGP',
                integration_id: integrationId,
            }),
        });
        const paymentKeyData = await paymentKeyRes.json();
        const paymentKey = paymentKeyData.token;

        if (!paymentKey) {
            throw new Error('Failed to get payment key from Paymob');
        }

        return NextResponse.json({
            success: true,
            paymentKey,
            iframeId: process.env.PAYMOB_IFRAME_ID,
            orderId
        });

    } catch (error: any) {
        console.error('Paymob session creation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
