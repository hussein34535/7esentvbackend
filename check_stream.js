require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const rows = await sql`SELECT id, name, stream_link FROM channels WHERE stream_link IS NOT NULL LIMIT 3`;
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
}

check();
