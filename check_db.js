const postgres = require('postgres');
require('dotenv').config({ path: '../.env' });

const sql = postgres(process.env.DATABASE_URL);

async function check() {
    try {
        console.log('Checking payment_methods table...');
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payment_methods';
        `;
        console.log('Columns:', columns);

        const rows = await sql`SELECT * FROM payment_methods`;
        console.log('Rows count:', rows.length);
        console.log('Full Data:', JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error('Error during check:', e);
    } finally {
        await sql.end();
    }
}

check();
