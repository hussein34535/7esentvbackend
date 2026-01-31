const postgres = require('postgres');
require('dotenv').config({ path: '../.env' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
    try {
        console.log('Ensuring tables exist...');

        // 1. Create packages table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS packages (
                id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price NUMERIC NOT NULL,
                sale_price NUMERIC,
                duration_days INTEGER NOT NULL DEFAULT 30,
                features JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
        `;
        console.log('Checked packages table.');

        // 2. Create payment_requests table
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

        // 3. Add column if table existed but column didn't
        await sql`
            ALTER TABLE payment_requests 
            ADD COLUMN IF NOT EXISTS payment_identifier TEXT;
        `;
        console.log('Checked payment_requests table and columns.');

        // 4. RLS Policies
        await sql`ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY`;
        await sql`DROP POLICY IF EXISTS "Public select requests" ON payment_requests`;
        await sql`CREATE POLICY "Public select requests" ON payment_requests FOR SELECT USING (true)`;
        await sql`DROP POLICY IF EXISTS "Public insert requests" ON payment_requests`;
        await sql`CREATE POLICY "Public insert requests" ON payment_requests FOR INSERT WITH CHECK (true)`;
        await sql`DROP POLICY IF EXISTS "Public update requests" ON payment_requests`;
        await sql`CREATE POLICY "Public update requests" ON payment_requests FOR UPDATE USING (true)`;

        console.log('Done.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

run();
