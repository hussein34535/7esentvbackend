
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
        return json.data;
    } catch (e) {
        console.error(`Error fetching ${endpoint}:`, e.message);
        return [];
    }
}

async function migrateRelations() {
    console.log('🚀 Starting Relations Sync (Channel-First v4)...');

    // 1. Load current DB state
    const currentCats = await sql`SELECT id, name FROM channel_categories`;
    const currentChannels = await sql`SELECT id, name FROM channels`;

    const catMap = new Map(currentCats.map(c => [c.name.trim().toLowerCase(), c.id]));
    const channelMap = new Map(currentChannels.map(c => [c.name.trim().toLowerCase(), c.id]));

    console.log(`Loaded ${currentCats.length} categories and ${currentChannels.length} channels from DB.`);

    let linksAdded = 0;
    let page = 1;
    const pageSize = 50;
    let hasMore = true;

    while (hasMore) {
        // Request channels and populate strictly the field we saw in debug: channel_categories
        const endpoint = `/channels?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=channel_categories`;
        const channels = await fetchAPI(endpoint);

        if (!channels || channels.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`Processing Page ${page}...`);

        for (const channel of channels) {
            // Flatten if needed, though debug showed flat structure
            const chName = channel.name || (channel.attributes && channel.attributes.name);
            if (!chName) continue;

            const dbChId = channelMap.get(chName.trim().toLowerCase());
            if (!dbChId) {
                // Channel not in our DB
                continue;
            }

            // Access the relation
            // Debug showed: channel.channel_categories (array)
            // Or channel.attributes.channel_categories
            let catsPayload = channel.channel_categories || (channel.attributes && channel.attributes.channel_categories);

            let catsList = [];
            if (catsPayload) {
                if (Array.isArray(catsPayload)) catsList = catsPayload;
                else if (catsPayload.data && Array.isArray(catsPayload.data)) catsList = catsPayload.data;
            }

            if (catsList.length > 0) {
                // process.stdout.write(`[${chName}] `);
                for (const catObj of catsList) {
                    const catName = catObj.name || (catObj.attributes && catObj.attributes.name);
                    if (!catName) continue;

                    const dbCatId = catMap.get(catName.trim().toLowerCase());
                    if (!dbCatId) {
                        console.warn(`Category "${catName}" not found in DB (for channel ${chName})`);
                        continue;
                    }

                    // Link
                    try {
                        const [exists] = await sql`SELECT 1 FROM _rel_channels_categories WHERE channel_id = ${dbChId} AND category_id = ${dbCatId}`;
                        if (!exists) {
                            await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${dbChId}, ${dbCatId})`;
                            linksAdded++;
                            process.stdout.write('+');
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }

        if (channels.length < pageSize) hasMore = false;
        page++;
    }

    console.log(`\n\n✅ Sync Complete!`);
    console.log(`Added ${linksAdded} TOTAL new relationships.`);
    process.exit(0);
}

migrateRelations().catch(e => {
    console.error(e);
    process.exit(1);
});
