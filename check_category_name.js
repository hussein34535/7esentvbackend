
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
    console.log('--- Searching for Categories ---');
    try {
        const cats = await sql`SELECT id, name FROM channel_categories WHERE LOWER(name) LIKE '%bein sport%'`;
        console.table(cats);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
