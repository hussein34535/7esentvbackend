const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

// Use the same logic as src/lib/db.ts
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;
    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
        connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD || '')}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
    }
}

if (!connectionString) {
    console.error('Error: DATABASE_URL or connection parameters not found in .env.local');
    process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    connect_timeout: 10
});

async function migrate() {
    try {
        console.log('Adding image column to channel_categories...');
        await sql`ALTER TABLE channel_categories ADD COLUMN IF NOT EXISTS image JSONB`;
        console.log('Successfully added image column.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

migrate();
