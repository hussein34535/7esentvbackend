require('dotenv').config({ path: '.env.local' });
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

async function applyAnalyticsSchema() {
    console.log('Applying Analytics Schema...');

    try {
        // 1. Create daily_stats table
        console.log('Creating daily_stats table...');
        await sql`
            CREATE TABLE IF NOT EXISTS daily_stats (
                date date PRIMARY KEY,
                active_users integer DEFAULT 0,
                new_users integer DEFAULT 0,
                total_requests integer DEFAULT 0,
                updated_at timestamptz DEFAULT now()
            );
        `;
        console.log('✅ daily_stats table created.');

        // 2. Add last_active_at to users if not exists
        console.log('Adding last_active_at to users...');
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at timestamptz`;
        console.log('✅ Added last_active_at to users.');

        // 3. Analytics Policies
        console.log('Applying RLS policies...');
        // Drop existing to avoid conflict if re-run
        try { await sql`DROP POLICY IF EXISTS "Allow public read" ON daily_stats`; } catch (e) { }
        try { await sql`DROP POLICY IF EXISTS "Allow public all" ON daily_stats`; } catch (e) { }

        await sql`CREATE POLICY "Allow public read" ON daily_stats FOR SELECT USING (true)`;
        await sql`CREATE POLICY "Allow public all" ON daily_stats FOR ALL USING (true) WITH CHECK (true)`;

        // Enable RLS
        await sql`ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY`;

        console.log('✅ Analytics Policies applied.');
        console.log('🎉 Migration Complete!');
    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        await sql.end();
    }
}

applyAnalyticsSchema();
