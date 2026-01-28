
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

// DB Connection Logic (Same as migration script)
let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;
    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
        connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
    }
}

const sql = postgres(connectionString, { ssl: 'require' });

async function check() {
    console.log('📊 Verifying Migration Data...\n');

    const categories = await sql`SELECT count(*) FROM channel_categories`;
    console.log(`Categories: ${categories[0].count}`);

    const channels = await sql`SELECT count(*) FROM channels`;
    console.log(`Channels: ${channels[0].count}`);

    const news = await sql`SELECT count(*) FROM news`;
    console.log(`News: ${news[0].count}`);

    const goals = await sql`SELECT count(*) FROM goals`;
    console.log(`Goals: ${goals[0].count}`);

    const matches = await sql`SELECT count(*) FROM matches`;
    console.log(`Matches: ${matches[0].count}`);

    const relations = await sql`SELECT count(*) FROM _rel_channels_categories`;
    console.log(`Relations (Channel <-> Category): ${relations[0].count}`);

    process.exit(0);
}

check().catch(console.error);
