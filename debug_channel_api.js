
require('dotenv').config({ path: '.env.local' });
const API_BASE = 'https://st9.onrender.com/api';

async function fetchAPI(endpoint) {
    const url = `${API_BASE}${endpoint}`;
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        return json.data;
    } catch (e) {
        console.error('Fetch Error:', e.message);
        return null;
    }
}

async function check() {
    console.log('--- Debug Channel API Structure ---');
    // Fetch 1 item, populate ALL fields
    const channels = await fetchAPI('/channels?pagination[limit]=1&populate=*');

    if (!channels) {
        console.log('❌ No data returned from API.');
        return;
    }

    if (Array.isArray(channels) && channels.length > 0) {
        const item = channels[0];
        console.log('✅ Channel Item Found');
        console.log('Root Keys:', Object.keys(item));

        if (item.attributes) {
            console.log('Attributes Keys:', Object.keys(item.attributes));
            // Check specific relations patterns
            const attrs = item.attributes;
            if (attrs.categories) console.log('👉 Found "categories" relation');
            if (attrs.category) console.log('👉 Found "category" relation');
            if (attrs.channel_categories) console.log('👉 Found "channel_categories" relation');
        } else {
            console.log('⚠️ No attributes object found (Is this Strapi v3?)');
        }

        console.log('\n--- HEAD of JSON ---');
        console.log(JSON.stringify(item, null, 2).substring(0, 1000) + '...');
    } else {
        console.log('⚠️ Channels response is distinct:', typeof channels);
        console.log(JSON.stringify(channels, null, 2));
    }
}

check();
