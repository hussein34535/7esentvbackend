const API_BASE = 'https://st9.onrender.com/api';

async function testFetch() {
    // Try sending publicationState=preview to see drafts
    const endpoints = [
        '/channel-categories?publicationState=preview',
        '/matches?publicationState=preview',
        '/goals?publicationState=preview'
    ];

    for (const ep of endpoints) {
        console.log(`Checking ${ep}...`);
        try {
            const res = await fetch(`${API_BASE}${ep}`);
            const json = await res.json();
            const count = json.data?.length || 0;
            console.log(`> Found: ${count} items`);
        } catch (e) {
            console.error(e.message);
        }
    }
}

testFetch();
