const sql = require('./src/lib/db_migration');

async function applyAnalyticsSchema() {
    console.log('Applying Analytics Schema...');

    try {
        // 1. Create daily_stats table
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
        try {
            await sql`ALTER TABLE users ADD COLUMN last_active_at timestamptz`;
            console.log('✅ Added last_active_at to users.');
        } catch (e) {
            console.log('ℹ️ last_active_at column likely exists or error:', e.message);
        }

        // 3. Analytics Policies
        // Drop existing to avoid conflict if re-run
        try {
            await sql`DROP POLICY IF EXISTS "Allow public read" ON daily_stats`;
            await sql`DROP POLICY IF EXISTS "Allow public all" ON daily_stats`;
        } catch (e) { }

        await sql`CREATE POLICY "Allow public read" ON daily_stats FOR SELECT USING (true)`;
        await sql`CREATE POLICY "Allow public all" ON daily_stats FOR ALL USING (true) WITH CHECK (true)`; // Simplified for now

        // Enable RLS
        await sql`ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY`;

        console.log('✅ Analytics Policies applied.');
        console.log('🎉 Migration Complete!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration Failed:', e);
        process.exit(1);
    }
}

applyAnalyticsSchema();
