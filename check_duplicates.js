
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
    console.log('--- Checking Duplicates ---');

    // Check Categories
    const cats = await sql`
        SELECT name, COUNT(*) as count, array_agg(id) as ids 
        FROM channel_categories 
        GROUP BY name 
        HAVING COUNT(*) > 1
    `;
    console.log(`\nDuplicate Categories: ${cats.length}`);
    if (cats.length > 0) console.table(cats);

    process.exit(0);
}

check();
