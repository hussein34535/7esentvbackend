require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

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

async function checkCounts() {
    console.log('📊 Checking Database Counts...');

    try {
        const [channels] = await sql`SELECT count(*) FROM channels`;
        const [categories] = await sql`SELECT count(*) FROM channel_categories`;
        const [relations] = await sql`SELECT count(*) FROM _rel_channels_categories`;
        const [news] = await sql`SELECT count(*) FROM news`;
        const [goals] = await sql`SELECT count(*) FROM goals`;
        const [matches] = await sql`SELECT count(*) FROM matches`;

        console.log(`- Channels: ${channels.count}`);
        console.log(`- Categories: ${categories.count}`);
        console.log(`- Cat-Channel Links: ${relations.count}`);
        console.log(`- News: ${news.count}`);
        console.log(`- Goals: ${goals.count}`);
        console.log(`- Matches: ${matches.count}`);

    } catch (e) {
        console.error('❌ Error checking counts:', e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

checkCounts();
