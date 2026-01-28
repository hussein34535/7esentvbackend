
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
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        return json.data; // Assuming flat structure array
    } catch (e) {
        console.error(`Error fetching ${endpoint}:`, e);
        return [];
    }
}

async function migrateRelations() {
    console.log('🚀 Starting Relations Sync (Channel-First Strategy)...');

    // 1. Load current DB state and normalize keys to lowercase
    const currentCats = await sql`SELECT id, name FROM channel_categories`;
    const currentChannels = await sql`SELECT id, name FROM channels`;

    const catMap = new Map(currentCats.map(c => [c.name.trim().toLowerCase(), c.id]));
    const channelMap = new Map(currentChannels.map(c => [c.name.trim().toLowerCase(), c.id]));

    console.log(`Loaded ${currentCats.length} categories and ${currentChannels.length} channels from DB.`);

    let linksAdded = 0;
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
        // Fetch Channels with their categories
        // Using populate=channel_categories to get the relation
        const channels = await fetchAPI(`/channels?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=channel_categories`);

        if (!channels || channels.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`Processing Page ${page} (${channels.length} channels)...`);

        for (const channel of channels) {
            // Handle Flat Structure (no .attributes)
            // Or fallback if it somehow varies
            const chName = channel.name || (channel.attributes && channel.attributes.name);

            if (!chName) continue;

            const dbChId = channelMap.get(chName.trim().toLowerCase());
            if (!dbChId) {
                // console.warn(`Skipping unknown channel: ${chName}`);
                continue;
            }

            // Get Categories payload
            const catsPayload = channel.channel_categories || (channel.attributes && channel.attributes.channel_categories);

            // Normalize list
            let catsList = [];
            if (catsPayload) {
                if (Array.isArray(catsPayload)) catsList = catsPayload;
                else if (catsPayload.data && Array.isArray(catsPayload.data)) catsList = catsPayload.data;
            }

            for (const catObj of catsList) {
                const catName = catObj.name || (catObj.attributes && catObj.attributes.name);
                if (!catName) continue;

                const dbCatId = catMap.get(catName.trim().toLowerCase());
                if (!dbCatId) {
                    console.warn(`Category not found in DB: ${catName} (for channel ${chName})`);
                    continue;
                }

                // Insert Relation
                try {
                    const [exists] = await sql`SELECT 1 FROM _rel_channels_categories WHERE channel_id = ${dbChId} AND category_id = ${dbCatId}`;
                    if (!exists) {
                        await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${dbChId}, ${dbCatId})`;
                        linksAdded++;
                        process.stdout.write('+');
                    }
                } catch (e) {
                    console.error(`Error linking ${chName} -> ${catName}`, e);
                }
            }
        }

        if (channels.length < pageSize) hasMore = false;
        page++;
    }

    console.log(`\n\n✅ Sync Complete! Added ${linksAdded} missing relationships.`);
    process.exit(0);
}

migrateRelations().catch(e => {
    console.error(e);
    process.exit(1);
});
