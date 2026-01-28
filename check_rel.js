
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;
    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
        connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
    }
}

const sql = postgres(connectionString);

async function check() {
    try {
        console.log('Checking _rel_channels_categories...');
        const rels = await sql`SELECT * FROM _rel_channels_categories LIMIT 5`;
        console.log('Relations found:', rels);

        console.log('Checking channels...');
        const channels = await sql`SELECT id, name FROM channels ORDER BY id DESC LIMIT 3`;
        console.log('Recent Channels:', channels);

        if (channels.length > 0) {
            console.log(`Checking relations for channel ${channels[0].id}...`);
            const specificRel = await sql`SELECT * FROM _rel_channels_categories WHERE channel_id = ${channels[0].id}`;
            console.log(`Relations for channel ${channels[0].id}:`, specificRel);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
