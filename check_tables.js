require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function listTables() {
    let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    // Fallback logic from export_db.js
    if (!connectionString) {
        const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_SSL } = process.env;
        if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
            connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}`;
            if (DATABASE_SSL === 'true' || DATABASE_SSL === true) connectionString += '?sslmode=require';
            else connectionString += '?sslmode=require';
        }
    }

    if (!connectionString) {
        console.error('❌ Connection URL not found.');
        process.exit(1);
    }

    const sql = postgres(connectionString, { ssl: 'require' });

    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;

        console.log('--- FOUND TABLES ---');
        tables.forEach(t => console.log(`- ${t.table_name}`));
        console.log('--------------------');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

listTables();
