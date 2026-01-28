require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

// ---------------------------------------------------------
// DB Connection Logic (Pooler Compatible)
// ---------------------------------------------------------
const { DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD } = process.env;

const dbConfig = {
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT),
    database: DATABASE_NAME,
    username: DATABASE_USERNAME,
    password: DATABASE_PASSWORD,
    ssl: 'require'
};

const sql = postgres(dbConfig);
const API_BASE = 'https://st9.onrender.com/api';

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function transformImage(strapiImageField) {
    if (!strapiImageField) return null;
    const rawData = strapiImageField.data || strapiImageField;
    if (!rawData) return null;
    const items = Array.isArray(rawData) ? rawData : [rawData];
    return items.map(item => {
        const attr = item.attributes || item;
        return {
            id: item.id,
            name: attr.name,
            hash: attr.hash,
            ext: attr.ext,
            mime: attr.mime,
            width: attr.width,
            height: attr.height,
            size: attr.size,
            url: attr.url,
            provider: attr.provider,
            createdAt: attr.createdAt,
            updatedAt: attr.updatedAt
        };
    });
}

async function fetchAPI(endpoint) {
    const url = `${API_BASE}${endpoint}`;
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        console.log(`   > Received ${json.data?.length || 0} items.`);
        return json.data || [];
    } catch (e) {
        console.error(`Error fetching ${endpoint}:`, e);
        return [];
    }
}

// ---------------------------------------------------------
// Migration Logic
// ---------------------------------------------------------

async function migrate() {
    console.log('🚀 Starting Full Migration from API...');

    // 0. Clean old data
    console.log('🧹 Cleaning existing data...');
    try {
        await sql`TRUNCATE matches, goals, news, _rel_channels_categories, channels, channel_categories RESTART IDENTITY CASCADE`;
        console.log('✅ Tables cleaned.');
    } catch (e) {
        console.warn('⚠️ Warning during cleanup:', e.message);
    }

    // 1. Categories & Channels
    console.log('\n--- Migrating Categories & Channels ---');
    const categories = await fetchAPI('/channel-categories?populate[channels][populate]=*&sort=createdAt:asc');

    for (const cat of categories) {
        const attr = cat.attributes || cat;
        if (!attr || !attr.name) {
            console.log('Skipping invalid category item');
            continue;
        }
        console.log(`Processing Category: ${attr.name}`);

        try {
            // Insert Category
            const [insertedCat] = await sql`
                INSERT INTO channel_categories (name, is_premium, sort_order, created_at, updated_at)
                VALUES (${attr.name}, ${attr.is_premium || false}, ${attr.sort_order || 0}, ${attr.createdAt}, ${attr.updatedAt})
                RETURNING id
            `;

            // Process Channels
            let channelsList = [];
            if (attr.channels) {
                if (Array.isArray(attr.channels)) channelsList = attr.channels;
                else if (attr.channels.data && Array.isArray(attr.channels.data)) channelsList = attr.channels.data;
            }

            for (const channel of channelsList) {
                const cAttr = channel.attributes || channel;
                let streamLink = cAttr.StreamLink || cAttr.stream_link;

                // Insert Channel
                const [insertedChannel] = await sql`
                    INSERT INTO channels (name, stream_link, created_at, updated_at)
                    VALUES (${cAttr.name}, ${streamLink ? JSON.stringify(streamLink) : null}, ${cAttr.createdAt}, ${cAttr.updatedAt})
                    RETURNING id
                `;

                // Link to Category
                await sql`
                    INSERT INTO _rel_channels_categories (channel_id, category_id)
                    VALUES (${insertedChannel.id}, ${insertedCat.id})
                `;
            }
        } catch (dbErr) {
            console.error(`Error processing category ${attr.name}:`, dbErr);
        }
    }

    // 2. News
    console.log('\n--- Migrating News ---');
    const news = await fetchAPI('/news?populate=*');
    for (const item of news) {
        const attr = item.attributes || item;
        const image = transformImage(attr.image);
        try {
            await sql`
                INSERT INTO news (title, image, link, is_premium, is_published, date, created_at, updated_at)
                VALUES (
                    ${attr.title}, 
                    ${image ? sql.json(image) : null}, 
                    ${attr.link ? JSON.stringify(attr.link) : null}, 
                    ${attr.is_premium || false}, 
                    true, 
                    ${attr.date || attr.createdAt},
                    ${attr.createdAt}, 
                    ${attr.updatedAt}
                )
            `;
            process.stdout.write('.');
        } catch (e) {
            console.error('\nError inserting news:', e);
        }
    }

    // 3. Goals
    console.log('\n\n--- Migrating Goals ---');
    const goals = await fetchAPI('/goals?populate=*');
    for (const item of goals) {
        const attr = item.attributes || item;
        const image = transformImage(attr.image);
        try {
            await sql`
                INSERT INTO goals (title, image, url, is_premium, is_published, time, created_at, updated_at)
                VALUES (
                    ${attr.title}, 
                    ${image ? sql.json(image) : null}, 
                    ${attr.url ? JSON.stringify(attr.url) : null}, 
                    ${attr.is_premium || false}, 
                    true,
                    ${attr.createdAt}, 
                    ${attr.createdAt}, 
                    ${attr.updatedAt}
                )
            `;
            process.stdout.write('.');
        } catch (e) { console.error('\nError inserting goal:', e); }
    }

    // 4. Matches
    console.log('\n\n--- Migrating Matches ---');
    const matches = await fetchAPI('/matches?populate=*');
    for (const item of matches) {
        const attr = item.attributes || item;
        const logoA = transformImage(attr.logo_a)?.[0] || null;
        const logoB = transformImage(attr.logo_b)?.[0] || null;
        try {
            await sql`
                INSERT INTO matches (
                    team_a, team_b, logo_a, logo_b, 
                    match_time, commentator, channel, champion, 
                    stream_link, is_premium, is_published, 
                    created_at, updated_at
                )
                VALUES (
                    ${attr.team_a}, 
                    ${attr.team_b}, 
                    ${logoA ? sql.json(logoA) : null}, 
                    ${logoB ? sql.json(logoB) : null}, 
                    ${attr.match_time}, 
                    ${attr.commentator}, 
                    ${attr.channel}, 
                    ${attr.champion}, 
                    ${attr.stream_link ? JSON.stringify(attr.stream_link) : null}, 
                    ${attr.is_premium || false}, 
                    true,
                    ${attr.createdAt}, 
                    ${attr.updatedAt}
                )
            `;
            process.stdout.write('.');
        } catch (e) { console.error('\nError inserting match:', e); }
    }

    console.log('\n\n✅ Migration Complete!');
    process.exit(0);
}

migrate().catch(e => {
    console.error(e);
    process.exit(1);
});
