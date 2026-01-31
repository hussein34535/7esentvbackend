require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const { DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;

let connectionString = DATABASE_URL;
if (!connectionString && DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
    connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
}

const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

async function seedPayment() {
    console.log('Seeding Payment Method...');
    try {
        await sql`
            INSERT INTO payment_methods (name, number, instructions, is_active)
            VALUES (
                'Vodafone Cash', 
                '01012345678', 
                'قم بالتحويل لهذا الرقم ثم أرسل صورة الإيصال', 
                true
            )
        `;
        console.log('✅ Added Vodafone Cash.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}
seedPayment();
