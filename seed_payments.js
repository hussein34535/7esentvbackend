const postgres = require('postgres');
require('dotenv').config({ path: '../.env' });

const sql = postgres(process.env.DATABASE_URL);

async function seed() {
    try {
        console.log('Seeding sample payment method...');
        await sql`
            INSERT INTO payment_methods (name, number, instructions, input_label, is_active)
            VALUES ('فودافون كاش (تجريبي)', '010XXXXXXXX', 'حول المبلغ وارفع الصورة', 'رقم المحفظة التي حولت منها', true)
        `;
        console.log('Sample data added.');
    } catch (e) {
        console.error('Error seeding:', e);
    } finally {
        await sql.end();
    }
}

seed();
