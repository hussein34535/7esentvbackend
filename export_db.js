require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

// ---------------------------------------------------------
// DB Connection Logic (Reused)
// ---------------------------------------------------------
let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    const {
        DATABASE_USERNAME,
        DATABASE_PASSWORD,
        DATABASE_HOST,
        DATABASE_PORT,
        DATABASE_NAME,
        DATABASE_SSL
    } = process.env;

    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
        const encodedPassword = encodeURIComponent(DATABASE_PASSWORD);
        const port = DATABASE_PORT || 5432;
        const dbName = DATABASE_NAME || 'postgres';
        connectionString = `postgres://${DATABASE_USERNAME}:${encodedPassword}@${DATABASE_HOST}:${port}/${dbName}`;
        if (DATABASE_SSL === 'true' || DATABASE_SSL === true) {
            connectionString += '?sslmode=require';
        } else {
            connectionString += '?sslmode=require';
        }
    }
}

if (!connectionString) {
    console.error('❌ Error: Could not determine Database Connection URL.');
    process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

// ---------------------------------------------------------
// Export Logic
// ---------------------------------------------------------

const escapeStr = (val) => {
    if (val === null || val === undefined) return 'NULL';
    // Postgres string escaping: replace ' with ''
    return `'${String(val).replace(/'/g, "''")}'`;
};

const escapeJson = (val) => {
    if (val === null || val === undefined) return 'NULL';
    // JSON needs to be a string literal, properly escaped
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
};

const escapeBool = (val) => (val === true ? 'true' : 'false');
const escapeInt = (val) => (val === null || val === undefined ? 'NULL' : val);

async function exportData() {
    console.log('🚀 Starting Database Export...');
    const stream = fs.createWriteStream('dump.sql', { flags: 'w' });

    stream.write('-- 7esen Database Dump\n');
    stream.write(`-- Generated at ${new Date().toISOString()}\n\n`);

    try {
        // 1. CHANNELS
        console.log('📦 Exporting Channels...');
        const channels = await sql`SELECT * FROM channels ORDER BY id`;
        for (const row of channels) {
            stream.write(`INSERT INTO channels (id, name, stream_link, created_at, updated_at) VALUES (${row.id}, ${escapeStr(row.name)}, ${escapeJson(row.stream_link)}, ${escapeStr(row.created_at.toISOString())}, ${escapeStr(row.updated_at.toISOString())}) ON CONFLICT (id) DO NOTHING;\n`);
        }

        // 2. CATEGORIES
        console.log('📦 Exporting Categories...');
        const categories = await sql`SELECT * FROM channel_categories ORDER BY id`;
        for (const row of categories) {
            stream.write(`INSERT INTO channel_categories (id, name, is_premium, sort_order, created_at, updated_at) VALUES (${row.id}, ${escapeStr(row.name)}, ${escapeBool(row.is_premium)}, ${escapeInt(row.sort_order)}, ${escapeStr(row.created_at.toISOString())}, ${escapeStr(row.updated_at.toISOString())}) ON CONFLICT (id) DO NOTHING;\n`);
        }

        // 3. RELATIONS
        console.log('📦 Exporting Relations...');
        const rels = await sql`SELECT * FROM _rel_channels_categories`;
        for (const row of rels) {
            stream.write(`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${row.channel_id}, ${row.category_id}) ON CONFLICT (channel_id, category_id) DO NOTHING;\n`);
        }

        // 4. MATCHES
        console.log('📦 Exporting Matches...');
        const matches = await sql`SELECT * FROM matches ORDER BY id`;
        for (const row of matches) {
            stream.write(`INSERT INTO matches (id, team_a, team_b, logo_a, logo_b, match_time, channel, commentator, champion, stream_link, is_premium, is_published, created_at, updated_at) VALUES (${row.id}, ${escapeStr(row.team_a)}, ${escapeStr(row.team_b)}, ${escapeJson(row.logo_a)}, ${escapeJson(row.logo_b)}, ${escapeStr(row.match_time)}, ${escapeStr(row.channel)}, ${escapeStr(row.commentator)}, ${escapeStr(row.champion)}, ${escapeJson(row.stream_link)}, ${escapeBool(row.is_premium)}, ${escapeBool(row.is_published)}, ${escapeStr(row.created_at.toISOString())}, ${escapeStr(row.updated_at.toISOString())}) ON CONFLICT (id) DO NOTHING;\n`);
        }

        // 5. GOALS
        console.log('📦 Exporting Goals...');
        const goals = await sql`SELECT * FROM goals ORDER BY id`;
        for (const row of goals) {
            stream.write(`INSERT INTO goals (id, title, image, url, time, is_premium, is_published, created_at, updated_at) VALUES (${row.id}, ${escapeStr(row.title)}, ${escapeJson(row.image)}, ${escapeJson(row.url)}, ${escapeStr(row.time)}, ${escapeBool(row.is_premium)}, ${escapeBool(row.is_published)}, ${escapeStr(row.created_at.toISOString())}, ${escapeStr(row.updated_at.toISOString())}) ON CONFLICT (id) DO NOTHING;\n`);
        }

        // 6. NEWS
        console.log('📦 Exporting News...');
        const news = await sql`SELECT * FROM news ORDER BY id`;
        for (const row of news) {
            stream.write(`INSERT INTO news (id, title, image, link, date, is_premium, is_published, created_at, updated_at) VALUES (${row.id}, ${escapeStr(row.title)}, ${escapeJson(row.image)}, ${escapeJson(row.link)}, ${escapeStr(row.date)}, ${escapeBool(row.is_premium)}, ${escapeBool(row.is_published)}, ${escapeStr(row.created_at.toISOString())}, ${escapeStr(row.updated_at.toISOString())}) ON CONFLICT (id) DO NOTHING;\n`);
        }

        // Update Sequence Numbers (Important for future inserts!)
        stream.write(`\n-- Reset Sequences\n`);
        stream.write(`SELECT setval('channels_id_seq', (SELECT MAX(id) FROM channels));\n`);
        stream.write(`SELECT setval('channel_categories_id_seq', (SELECT MAX(id) FROM channel_categories));\n`);
        stream.write(`SELECT setval('_rel_channels_categories_id_seq', (SELECT MAX(id) FROM _rel_channels_categories));\n`);
        stream.write(`SELECT setval('matches_id_seq', (SELECT MAX(id) FROM matches));\n`);
        stream.write(`SELECT setval('goals_id_seq', (SELECT MAX(id) FROM goals));\n`);
        stream.write(`SELECT setval('news_id_seq', (SELECT MAX(id) FROM news));\n`);

    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        stream.end();
        console.log('✅ Export Complete! File saved to: dump.sql');
        process.exit(0);
    }
}

exportData();
