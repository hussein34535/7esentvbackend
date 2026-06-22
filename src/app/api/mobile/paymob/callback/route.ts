import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // This GET route handles redirects after payment
        const success = searchParams.get('success');
        const orderId = searchParams.get('order');
        
        if (success === 'true') {
            return new NextResponse(`
                <html>
                <body style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background-color:#f0f9ff; color:#0369a1; text-align:center;">
                    <h1>Payment Successful!</h1>
                    <p>Your order ${orderId || ''} was processed successfully.</p>
                    <p>You can close this window and return to the app.</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        } else {
            return new NextResponse(`
                <html>
                <body style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background-color:#fff1f2; color:#be123c; text-align:center;">
                    <h1>Payment Failed</h1>
                    <p>There was an issue processing your payment.</p>
                    <p>Please close this window and try again.</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to process callback' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
        if (!hmacSecret) {
            return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
        }

        const hmacHeader = request.headers.get('hmac');
        const body = await request.json();

        // Paymob sends transactions to POST webhook
        if (body.type !== 'TRANSACTION') {
            return NextResponse.json({ success: true, message: 'Ignored non-transaction event' });
        }

        const obj = body.obj;
        const success = obj.success;
        const pending = obj.pending;
        
        // Construct HMAC string according to Paymob documentation
        const amount_cents = obj.amount_cents;
        const created_at = obj.created_at;
        const currency = obj.currency;
        const error_occured = obj.error_occured;
        const has_parent_transaction = obj.has_parent_transaction;
        const id = obj.id;
        const integration_id = obj.integration_id;
        const is_3d_secure = obj.is_3d_secure;
        const is_auth = obj.is_auth;
        const is_capture = obj.is_capture;
        const is_refunded = obj.is_refunded;
        const is_standalone_payment = obj.is_standalone_payment;
        const is_voided = obj.is_voided;
        const order_id = obj.order.id;
        const owner = obj.owner;
        const obj_pending = obj.pending;
        const source_data_pan = obj.source_data.pan;
        const source_data_sub_type = obj.source_data.sub_type;
        const source_data_type = obj.source_data.type;
        const obj_success = obj.success;

        const lexoStr = 
            amount_cents + created_at + currency + error_occured + has_parent_transaction +
            id + integration_id + is_3d_secure + is_auth + is_capture + is_refunded + 
            is_standalone_payment + is_voided + order_id + owner + obj_pending +
            source_data_pan + source_data_sub_type + source_data_type + obj_success;

        const hash = crypto.createHmac('sha512', hmacSecret).update(lexoStr).digest('hex');

        if (hash !== hmacHeader) {
            console.error('Invalid HMAC signature');
            return NextResponse.json({ success: false, error: 'Invalid HMAC' }, { status: 400 });
        }

        if (success && !pending) {
            console.log(`Payment successful for order ${order_id}. You should update the database here.`);
            // TODO: Update user subscription in database
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Paymob webhook error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
