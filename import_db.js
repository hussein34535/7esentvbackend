require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function importData() {
    console.log('🚀 Starting Database Import...');

    const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_SSL } = process.env;

    if (!DATABASE_HOST) {
        console.error('❌ Error: Database credentials missing in .env.local');
        process.exit(1);
    }

    const dbConfig = {
        host: DATABASE_HOST.replace('[', '').replace(']', ''), // Remove brackets if present for direct usage
        port: Number(DATABASE_PORT) || 5432,
        database: DATABASE_NAME,
        username: DATABASE_USERNAME,
        password: DATABASE_PASSWORD,
        ssl: 'require'
    };

    console.log('🔧 DB Config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.username,
        db: dbConfig.database,
        ssl: dbConfig.ssl
    });

    const sql = postgres(dbConfig);

    try {
        console.log('📡 Connecting to new database...');

        // 1. Run Schema
        console.log('🏗️  Applying Schema (schema.sql)...');
        const schema = fs.readFileSync('schema.sql', 'utf8');
        // Split by semicolon to run statements individually (basic split)
        // Note: This simple split might fail on complex bodies with semicolons, but for our schema it should be fine.
        // Better to let the driver handle the whole block if possible, or split carefully.
        // postgres.js 'file' helper is good, but we have raw string.

        // Let's try executing the whole block.
        await sql.unsafe(schema);
        console.log('✅ Schema Applied.');


        // 2. Run Dump
        console.log('📦 Importing Data (dump.sql)...');
        if (fs.existsSync('dump.sql')) {
            const dumpData = fs.readFileSync('dump.sql', 'utf8');
            // Execute the dump. It contains many INSERTs.
            await sql.unsafe(dumpData);
            console.log('✅ Data Imported.');
        } else {
            console.log('⚠️ dump.sql not found. Skipping data import.');
        }

    } catch (e) {
        console.error('❌ Import Failed:', e);
    } finally {
        await sql.end();
        console.log('🎉 Migration Finished!');
        process.exit(0);
    }
}

importData();
