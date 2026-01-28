require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

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

async function restore() {
    console.log('🚀 Starting Data Restoration from dump.sql...');

    try {
        // 1. Truncate again to be clean (but keep schema)
        console.log('🧹 Clearing tables...');
        // Order matters for Foreign Keys
        await sql`TRUNCATE _rel_channels_categories, channels, channel_categories, matches, goals, news RESTART IDENTITY CASCADE`;
        console.log('✅ Tables cleared.');

        // 2. Read Dump
        if (!fs.existsSync('dump.sql')) {
            throw new Error('dump.sql not found!');
        }
        const dumpContent = fs.readFileSync('dump.sql', 'utf8');

        // 3. Execute Dump
        // We use simple query execution. The dump contains semi-colon separated INSERTs.
        console.log('📥 Importing data...');
        // postgres.js can handle multiple statements if simple
        await sql.unsafe(dumpContent);

        console.log('✅ Data restored from dump.sql');

    } catch (e) {
        console.error('❌ Restore failed:', e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

restore();
