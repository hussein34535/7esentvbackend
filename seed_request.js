const fetch = require('node-fetch');

async function testSubmit() {
    console.log('Testing Submit Payment Request...');

    // Simulate Mobile App Request
    const payload = {
        uid: 'test_user_123',
        packageId: 1, // Assuming package 1 exists
        receiptImage: {
            url: 'https://placehold.co/600x400/png', // Placeholder image
            public_id: 'test_receipt'
        }
    };

    try {
        const response = await fetch('http://localhost:3000/api/mobile/submit-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

testSubmit();
