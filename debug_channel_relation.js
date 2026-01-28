
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
    console.log('--- Debug Channel 205 (Bein Sport SD 1) ---');
    // Try multiple populate formats just in case
    const ch = await fetchAPI('/channels/205?populate=channel_categories&populate=categories&populate=Category');

    if (!ch) {
        console.log('❌ Channel not found or error.');
        return;
    }

    console.log('Keys:', Object.keys(ch));
    if (ch.attributes) {
        console.log('Attributes:', Object.keys(ch.attributes));
        console.log('channel_categories:', JSON.stringify(ch.attributes.channel_categories, null, 2));
        console.log('categories:', JSON.stringify(ch.attributes.categories, null, 2));
    } else {
        console.log('channel_categories:', JSON.stringify(ch.channel_categories, null, 2));
        console.log('categories:', JSON.stringify(ch.categories, null, 2));
    }
}

check();
