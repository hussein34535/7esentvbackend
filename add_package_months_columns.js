const postgres = require('postgres');

const { DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;

let connectionString = DATABASE_URL;
if (!connectionString && DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
    connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
}

if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        console.log('Adding duration_months and discount_months columns to packages table...');
        
        await sql`
            ALTER TABLE packages 
            ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS discount_months INTEGER DEFAULT 0;
        `;
        
        console.log('Migrating existing package data...');
        await sql`
            UPDATE packages 
            SET duration_months = COALESCE(duration_days / 30, 1)
            WHERE duration_months = 1 AND duration_days != 30;
        `;
        
        console.log('Migration successful!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

run();
