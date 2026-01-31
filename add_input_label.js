const postgres = require('postgres');
require('dotenv').config({ path: '../.env' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
    try {
        console.log('Adding input_label to payment_methods...');
        await sql`
            ALTER TABLE payment_methods 
            ADD COLUMN IF NOT EXISTS input_label TEXT DEFAULT 'رقم المحفظة / Reference ID';
        `;
        console.log('Column added successfully.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

run();
