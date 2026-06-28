const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function simulateWebhook() {
    const vendorKey = process.env.FAWATERAK_PROVIDER_KEY;
    if (!vendorKey) {
        console.error("Missing FAWATERAK_PROVIDER_KEY in .env.local");
        return;
    }

    // You need to put the user's UID here. We can use a dummy or let the user put it.
    // For this test, we will ask the user to enter their UID, or we can just send it.
    const uid = "REPLACE_WITH_YOUR_UID"; 
    const packageId = 1;
    
    const invoiceId = Math.floor(Math.random() * 1000000).toString();
    const invoiceKey = crypto.randomBytes(10).toString('hex');
    const paymentMethod = "wallet";

    // Generate Signature
    const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoiceKey}&PaymentMethod=${paymentMethod}`;
    const hashKey = crypto
        .createHmac('sha256', vendorKey)
        .update(queryParam)
        .digest('hex');

    const payload = {
        invoice_id: invoiceId,
        invoice_key: invoiceKey,
        payment_method: paymentMethod,
        hashKey: hashKey,
        status: "paid",
        payLoad: {
            uid: uid,
            packageId: packageId
        }
    };

    console.log("Sending simulated webhook to Vercel...");
    
    const res = await fetch('https://7esentvbackend.vercel.app/api/mobile/fawaterak/webhook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const resData = await res.json();
    console.log("Webhook Response:", res.status, resData);
}

simulateWebhook();
