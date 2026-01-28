
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

async function migrateRelationsV5() {
    console.log('🚀 Starting Relations Sync (v5 - Inverse Filter Strategy)...');

    // 1. Load current DB state
    const currentCats = await sql`SELECT id, name FROM channel_categories`;
    const currentChannels = await sql`SELECT id, name FROM channels`;

    const catMap = new Map(currentCats.map(c => [c.name.trim().toLowerCase(), c.id]));
    const channelMap = new Map(currentChannels.map(c => [c.name.trim().toLowerCase(), c.id]));

    console.log(`Loaded ${currentCats.length} categories and ${currentChannels.length} channels from DB.`);

    // 2. Fetch all categories
    console.log('Fetching Category List...');
    const categories = await fetchAPI('/channel-categories?pagination[pageSize]=1000');

    if (!categories || categories.length === 0) {
        console.error('No categories found.');
        process.exit(1);
    }

    let linksAdded = 0;

    // 3. Iterate Categories
    for (const catWrapper of categories) {
        const cat = catWrapper.attributes || catWrapper;
        const catApiId = catWrapper.id;
        const catName = cat.name.trim();

        const dbCatId = catMap.get(catName.toLowerCase());
        if (!dbCatId) {
            console.warn(`[Skip] Category "${catName}" not found in DB.`);
            continue;
        }

        // 4. Fetch Channels for this specific Category using FILTER
        // This avoids "deep populate" limits because we are paging the primary model (Channels)
        // Try filter key: channel_categories
        process.stdout.write(`Processing "${catName}"... `);

        let page = 1;
        let pageSize = 100;
        let hasMore = true;
        let catChannelCount = 0;

        while (hasMore) {
            // NOTE: Adjust filter name if needed (category vs channel_categories) based on previous debug
            const endpoint = `/channels?filters[channel_categories][id][$eq]=${catApiId}&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
            const channels = await fetchAPI(endpoint);

            if (!channels || channels.length === 0) {
                hasMore = false;
                break;
            }

            for (const chWrapper of channels) {
                const ch = chWrapper.attributes || chWrapper;
                const chName = ch.name;

                if (!chName) continue;

                const dbChId = channelMap.get(chName.trim().toLowerCase());
                if (!dbChId) continue;

                // Link in DB
                try {
                    const [exists] = await sql`SELECT 1 FROM _rel_channels_categories WHERE channel_id = ${dbChId} AND category_id = ${dbCatId}`;
                    if (!exists) {
                        await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${dbChId}, ${dbCatId})`;
                        linksAdded++;
                    }
                    catChannelCount++;
                } catch (e) {
                    // ignore
                }
            }

            if (channels.length < pageSize) hasMore = false;
            page++;
        }
        console.log(`Found ${catChannelCount} channels.`);
    }

    console.log(`\n\n✅ Sync Complete! Added ${linksAdded} new relationships.`);
    process.exit(0);
}

migrateRelationsV5().catch(e => {
    console.error(e);
    process.exit(1);
});
