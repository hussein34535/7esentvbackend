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

async function migrate() {
    try {
        console.log('Creating users table...');
        await sql`
      create table if not exists users (
        id text primary key,
        email text not null,
        subscription_end timestamptz,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      )
    `;
        console.log('Created users table.');

        console.log('Applying policies...');
        // Drop existing policies to avoid errors if they exist
        try { await sql`drop policy if exists "Allow public read" on users`; } catch (e) { }
        try { await sql`drop policy if exists "Allow public insert" on users`; } catch (e) { }
        try { await sql`drop policy if exists "Allow public update" on users`; } catch (e) { }
        try { await sql`drop policy if exists "Allow public delete" on users`; } catch (e) { }

        await sql`create policy "Allow public read" on users for select using (true)`;
        await sql`create policy "Allow public insert" on users for insert with check (true)`;
        await sql`create policy "Allow public update" on users for update using (true)`;
        await sql`create policy "Allow public delete" on users for delete using (true)`;

        // Enable RLS
        await sql`alter table users enable row level security`;

        console.log('Policies applied.');

        // Check if table exists
        const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
    `;

        if (tables.length > 0) {
            console.log('Verification: users table exists.');
        } else {
            console.error('Verification FAILED: users table not found.');
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.end();
    }
}

migrate();
