const postgres = require('postgres');
require('dotenv').config({ path: '../.env' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
    try {
        console.log('Adding payment_identifier column...');
        await sql`
            ALTER TABLE payment_requests 
            ADD COLUMN IF NOT EXISTS payment_identifier TEXT;
        `;
        console.log('Column added successfully.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

run();
