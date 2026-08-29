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
    const results = {};
    try {
        console.log('Creating stream_tokens table...');
        await sql`
      create table if not exists stream_tokens (
        token text primary key,
        uid text,
        device_id text,
        issued_day bigint,
        created_at timestamptz default now(),
        last_seen_at timestamptz,
        active_session_id text,
        revoked boolean default false
      )
    `;
        console.log('Created stream_tokens table.');

        console.log('Creating stream_sessions table...');
        await sql`
      create table if not exists stream_sessions (
        session_id text primary key,
        token text,
        uid text,
        device_id text,
        started_at timestamptz default now(),
        last_heartbeat timestamptz,
        killed boolean default false,
        killed_reason text
      )
    `;
        console.log('Created stream_sessions table.');

        console.log('Adding channel_key column to stream_sessions...');
        await sql`alter table stream_sessions add column if not exists channel_key text`;
        console.log('channel_key column ready.');

        console.log('Adding device/ban columns to users...');
        await sql`alter table users add column if not exists active_device_id text`;
        await sql`alter table users add column if not exists device_changed_at timestamptz`;
        await sql`alter table users add column if not exists banned boolean default false`;
        await sql`alter table users add column if not exists ban_reason text`;
        console.log('Users columns ready.');

        console.log('Creating devices table...');
        await sql`
      create table if not exists devices (
        device_id text primary key,
        account_count int default 0,
        uids jsonb default '[]',
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      )
    `;
        console.log('Created devices table.');

        // Verification counts
        const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('stream_tokens', 'stream_sessions', 'devices')
    `;
        results.tablesCreated = tables.length;

        const userCols = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name IN ('active_device_id', 'device_changed_at', 'banned', 'ban_reason')
    `;
        results.userColumnsAdded = userCols.length;

        const sessionCols = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'stream_sessions'
          AND column_name = 'channel_key'
    `;
        results.channelKeyAdded = sessionCols.length;

        console.log('--- SUCCESS ---');
        console.log(`Tables present (expect 3): ${results.tablesCreated} [${tables.map(t => t.table_name).join(', ')}]`);
        console.log(`users columns present (expect 4): ${results.userColumnsAdded} [${userCols.map(c => c.column_name).join(', ')}]`);
        console.log(`stream_sessions channel_key present (expect 1): ${results.channelKeyAdded}`);
        if (results.tablesCreated !== 3 || results.userColumnsAdded !== 4 || results.channelKeyAdded !== 1) {
            console.error('Verification FAILED: expected 3 tables, 4 user columns and channel_key on stream_sessions.');
            process.exitCode = 1;
        }
    } catch (err) {
        console.error('Migration failed:', err);
        process.exitCode = 1;
    } finally {
        await sql.end();
    }
}

migrate();
