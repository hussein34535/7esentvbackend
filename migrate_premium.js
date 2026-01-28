const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  try {
    // 1. Add is_premium to channel_categories
    await sql`ALTER TABLE channel_categories ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE`;
    console.log('Verified is_premium on: channel_categories');

    // Add sort_order
    await sql`ALTER TABLE channel_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
    console.log('Verified sort_order on: channel_categories');

    // Matches
    await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE`;
    console.log('Verified columns on: matches');

    // Goals
    await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE`;
    console.log('Verified columns on: goals');

    // News
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE`;
    console.log('Verified columns on: news');

    // 2. Ensure junction table exists
    await sql`
      CREATE TABLE IF NOT EXISTS _rel_channels_categories (
        channel_id BIGINT REFERENCES channels(id) ON DELETE CASCADE,
        category_id BIGINT REFERENCES channel_categories(id) ON DELETE CASCADE,
        PRIMARY KEY (channel_id, category_id)
      )
    `;
    console.log('Verified junction table _rel_channels_categories.');

  } catch (e) {
    console.error('Migration failed:', e);
  }
  process.exit(0);
}

migrate();
