
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;
    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
        connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
    }
}
const sql = postgres(connectionString, { ssl: 'require' });
const API_BASE = 'https://st9.onrender.com/api';

async function fetchAPI(endpoint) {
    const url = `${API_BASE}${endpoint}`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        return json.data;
    } catch (e) { return []; }
}

async function debugMismatch() {
    console.log('--- Debugging Name Mismatch ---');

    // 1. Get API Channels for "BEIN SPORT SD" (Category ID 9 (from prev log? no, let's find it))
    // From logs: "Processing "BEIN SPORT SD"... Found 9 channels."
    // We need to find the ID for "BEIN SPORT SD" first.
    const cats = await fetchAPI('/channel-categories?filters[name][$contains]=BEIN%20SPORT%20SD');
    if (!cats || cats.length === 0) { console.log('Cat not found'); return; }

    const catId = cats[0].id; // attributes are separate? No, standard response.
    console.log(`API Category "BEIN SPORT SD" ID: ${catId}`);

    // Fetch its channels
    const channels = await fetchAPI(`/channels?filters[channel_categories][id][$eq]=${catId}&pagination[pageSize]=100`);
    const apiNames = channels.map(c => (c.attributes ? c.attributes.name : c.name).trim());

    console.log('\n--- API Names in "BEIN SPORT SD" ---');
    console.table(apiNames);

    // 2. Get DB Channels that look like them
    const dbChannels = await sql`SELECT id, name FROM channels WHERE name ILIKE '%bein sport sd%'`;
    const dbNames = dbChannels.map(c => c.name.trim());

    console.log('\n--- DB Names matching "%bein sport sd%" ---');
    console.table(dbNames);

    // 3. Direct compare
    console.log('\n--- Comparison ---');
    apiNames.forEach(apiName => {
        const match = dbNames.find(dbName => dbName.toLowerCase() === apiName.toLowerCase());
        console.log(`API: "${apiName}" -> DB Match: ${match ? '✅ ' + match : '❌ NONE'}`);
    });

    process.exit(0);
}

debugMismatch();
