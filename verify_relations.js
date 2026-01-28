
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

async function check() {
    console.log('--- Verifying Relations ---');

    // Find ALL duplicates of "Bein Sport SD 1"
    const channels = await sql`SELECT id, name FROM channels WHERE name ILIKE '%bein sport sd 1%'`;
    console.log(`Found ${channels.length} channels matching "Bein Sport SD 1"`);
    console.table(channels);

    for (const ch of channels) {
        const rels = await sql`
            SELECT r.category_id, c.name as category_name 
            FROM _rel_channels_categories r
            JOIN channel_categories c ON r.category_id = c.id
            WHERE r.channel_id = ${ch.id}
        `;

        if (rels.length > 0) {
            console.log(`✅ ID ${ch.id} is linked to:`, rels.map(r => `${r.category_name} (${r.category_id})`).join(', '));
        } else {
            console.log(`❌ ID ${ch.id} has NO categories.`);
        }
    }

    process.exit(0);
}

check();
