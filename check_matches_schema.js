
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
    console.log('--- Checking Matches Schema ---');
    try {
        const cols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'matches' AND column_name = 'stream_link'
        `;
        console.table(cols);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
