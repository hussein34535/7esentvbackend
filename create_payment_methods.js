const postgres = require('postgres');
require('dotenv').config({ path: '../.env' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
    try {
        console.log('Ensuring payment_methods table exists...');

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

        // Just in case it existed but missed the column
        await sql`
            ALTER TABLE payment_methods 
            ADD COLUMN IF NOT EXISTS input_label TEXT DEFAULT 'رقم المحفظة / Account Number';
        `;

        console.log('Table and columns ready.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

run();
