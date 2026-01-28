
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
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
}

async function debugChannel() {
    console.log('--- Debugging Channel: Bein Sport SD 1 ---');

    console.log('1. Fetching Old API Data...');
    const categories = await fetchAPI('/channel-categories?populate[channels][populate]=*&sort=createdAt:asc');

    let foundInOldAPI = false;
    const targetName = 'bein sport sd 1';

    for (const cat of categories) {
        const catAttr = cat.attributes || cat;
        if (!catAttr.channels) continue;

        const channels = Array.isArray(catAttr.channels) ? catAttr.channels : (catAttr.channels.data || []);

        for (const ch of channels) {
            const chAttr = ch.attributes || ch;
            if (chAttr.name && chAttr.name.trim().toLowerCase() === targetName) {
                console.log(`✅ Found in Old API!`);
                console.log(`   - Linked to Category: "${catAttr.name}"`);
                foundInOldAPI = true;
            }
        }
    }

    if (!foundInOldAPI) {
        console.log('❌ NOT found in any category in Old API with exact name match.');
        console.log('   (Did you mean a different name?)');
    }

    console.log('2. checking DB state for ID 43...');
    const channel = await sql`SELECT * FROM channels WHERE id = 43`;
    console.log('   Channel in DB:', channel);

    if (channel.length > 0) {
        const rels = await sql`SELECT * FROM _rel_channels_categories WHERE channel_id = 43`;
        console.log('   Relations in DB:', rels);
    }

    process.exit(0);
}

debugChannel();
