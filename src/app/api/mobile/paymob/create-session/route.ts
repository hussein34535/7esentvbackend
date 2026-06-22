import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        console.log('--- Paymob Create Session Started ---');
        
        let body;
        try {
            body = await request.json();
            console.log('Request body parsed successfully:', body);
        } catch (e: any) {
            console.error('Failed to parse request JSON body:', e);
            return NextResponse.json({ success: false, error: `Invalid request JSON body: ${e.message}` }, { status: 400 });
        }

        const { uid, packageId, couponCode, email, phone, firstName, lastName } = body;

        if (!uid || !packageId) {
            return NextResponse.json({ success: false, error: 'Missing uid or packageId' }, { status: 400 });
        }

        let apiKey = process.env.PAYMOB_API_KEY;
        let integrationId = process.env.PAYMOB_INTEGRATION_ID;

        // Clean double quotes if they were added in Vercel settings
        if (apiKey && apiKey.startsWith('"') && apiKey.endsWith('"')) {
            apiKey = apiKey.slice(1, -1);
        }
        if (integrationId && integrationId.startsWith('"') && integrationId.endsWith('"')) {
            integrationId = integrationId.slice(1, -1);
        }

        console.log('Config check - API Key length:', apiKey?.length, 'Integration ID:', integrationId);

        if (!apiKey || !integrationId) {
            return NextResponse.json({ success: false, error: 'Paymob credentials not configured on server' }, { status: 500 });
        }

        // 1. Authentication Request
        console.log('1. Fetching auth token from Paymob...');
        const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey }),
        });
        
        const authText = await authRes.text();
        console.log('Auth Res Status:', authRes.status, 'Body:', authText);

        let authData;
        try {
            authData = JSON.parse(authText);
        } catch (e: any) {
            throw new Error(`Failed to parse auth token response: ${authText}. Error: ${e.message}`);
        }
        
        const token = authData.token;
        if (!token) {
            throw new Error(`Failed to get auth token from Paymob. Response was: ${authText}`);
        }

        // 2. Order Registration Request
        // TODO: Map packageId to an actual price amount. Hardcoding 100 EGP for now.
        const amountCents = 10000; 

        console.log('2. Creating order in Paymob...');
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
        
        const orderText = await orderRes.text();
        console.log('Order Res Status:', orderRes.status, 'Body:', orderText);

        let orderData;
        try {
            orderData = JSON.parse(orderText);
        } catch (e: any) {
            throw new Error(`Failed to parse order response: ${orderText}. Error: ${e.message}`);
        }

        const orderId = orderData.id;
        if (!orderId) {
            throw new Error(`Failed to create order in Paymob. Response was: ${orderText}`);
        }

        // 3. Payment Key Request
        console.log('3. Getting payment key from Paymob...');
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
        
        const paymentKeyText = await paymentKeyRes.text();
        console.log('Payment Key Res Status:', paymentKeyRes.status, 'Body:', paymentKeyText);

        let paymentKeyData;
        try {
            paymentKeyData = JSON.parse(paymentKeyText);
        } catch (e: any) {
            throw new Error(`Failed to parse payment key response: ${paymentKeyText}. Error: ${e.message}`);
        }

        const paymentKey = paymentKeyData.token;
        if (!paymentKey) {
            throw new Error(`Failed to get payment key from Paymob. Response was: ${paymentKeyText}`);
        }

        console.log('Paymob Session Created Successfully!');

        let iframeId = process.env.PAYMOB_IFRAME_ID;
        if (iframeId && iframeId.startsWith('"') && iframeId.endsWith('"')) {
            iframeId = iframeId.slice(1, -1);
        }

        const checkout_url = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

        return NextResponse.json({
            success: true,
            paymentKey,
            iframeId,
            orderId,
            checkout_url
        });


    } catch (error: any) {
        console.error('Paymob session creation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

