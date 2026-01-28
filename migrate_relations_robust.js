
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

// ---------------------------------------------------------
// DB Connection Logic
// ---------------------------------------------------------
let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
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
    // console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        return json.data;
    } catch (e) {
        console.error(`Error fetching ${endpoint}:`, e.message);
        return null;
    }
}

async function migrateRelationsRobust() {
    console.log('🚀 Starting Robust Relations Sync (Category-Iterative)...');

    // 1. Load current DB state
    const currentCats = await sql`SELECT id, name FROM channel_categories`;
    const currentChannels = await sql`SELECT id, name FROM channels`;

    const catMap = new Map(currentCats.map(c => [c.name.trim().toLowerCase(), c.id]));
    const channelMap = new Map(currentChannels.map(c => [c.name.trim().toLowerCase(), c.id]));

    console.log(`Loaded ${currentCats.length} categories and ${currentChannels.length} channels from DB.`);

    // 2. Fetch all categories first (just ID and Name)
    console.log('Fetching Category List...');
    const categories = await fetchAPI('/channel-categories?pagination[pageSize]=1000');

    if (!categories || categories.length === 0) {
        console.error('No categories found in API.');
        process.exit(1);
    }

    let linksAdded = 0;
    let processedCats = 0;

    for (const catWrapper of categories) {
        const cat = catWrapper.attributes || catWrapper;
        const catId = catWrapper.id;
        const catName = cat.name.trim();

        // Find this category in our DB
        const dbCatId = catMap.get(catName.toLowerCase());
        if (!dbCatId) {
            console.warn(`[Skip] Category "${catName}" not found in DB.`);
            continue;
        }

        // 3. Fetch full details for this SPECIFIC category
        // Request deep population of channels with safer limit (100)
        const detailEndpoint = `/channel-categories/${catId}?populate[channels][pagination][pageSize]=100`;
        const categoryDetail = await fetchAPI(detailEndpoint);

        if (!categoryDetail) continue;

        const attr = categoryDetail.attributes || categoryDetail;
        let channelsList = [];
        if (attr.channels) {
            if (Array.isArray(attr.channels)) channelsList = attr.channels;
            else if (attr.channels.data && Array.isArray(attr.channels.data)) channelsList = attr.channels.data;
        }

        if (channelsList.length === 0) {
            // console.log(`   Category "${catName}" has no channels.`);
            continue;
        }

        process.stdout.write(`Category "${catName}" (${channelsList.length} ch): `);

        let addedForThis = 0;
        for (const chWrapper of channelsList) {
            const chAttr = chWrapper.attributes || chWrapper;
            const chName = chAttr.name;
            if (!chName) continue;

            const dbChId = channelMap.get(chName.trim().toLowerCase());
            if (!dbChId) continue;

            // Link
            try {
                const [exists] = await sql`SELECT 1 FROM _rel_channels_categories WHERE channel_id = ${dbChId} AND category_id = ${dbCatId}`;
                if (!exists) {
                    await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${dbChId}, ${dbCatId})`;
                    linksAdded++;
                    addedForThis++;
                }
            } catch (e) {
                // ignore
            }
        }
        console.log(`+${addedForThis} new links.`);
        processedCats++;
    }

    console.log(`\n\n✅ Sync Complete!`);
    console.log(`Processed ${processedCats} categories.`);
    console.log(`Added ${linksAdded} TOTAL new relationships.`);
    process.exit(0);
}

migrateRelationsRobust().catch(e => {
    console.error(e);
    process.exit(1);
});
