const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

// Construct connection string for aws-1
const dbUrl = `postgres://${process.env.DATABASE_USERNAME}:${encodeURIComponent(process.env.DATABASE_PASSWORD || '')}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT || 6543}/${process.env.DATABASE_NAME || 'postgres'}?sslmode=require`;

const sql = postgres(dbUrl);

async function run() {
    try {
        console.log('Syncing schema to Production (aws-1)...');

        // 1. Packages
        await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS sale_price NUMERIC`;
        console.log('Packages table synced.');

        // 2. Payment Methods
        await sql`
            CREATE TABLE IF NOT EXISTS payment_methods (
                id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                number TEXT,
                instructions TEXT,
                image JSONB DEFAULT 'null'::jsonb,
                input_label TEXT DEFAULT 'رقم المحفظة / Account Number',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
        `;
        await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS input_label TEXT DEFAULT 'رقم المحفظة / Account Number'`;
        console.log('Payment Methods table synced.');

        // 3. Payment Requests
        await sql`
            CREATE TABLE IF NOT EXISTS payment_requests (
                id BIGSERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,
                receipt_image JSONB NOT NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                payment_identifier TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
        `;
        await sql`ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS payment_identifier TEXT`;
        console.log('Payment Requests table synced.');

        console.log('Sync Complete.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

run();
