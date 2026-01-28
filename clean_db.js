const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function clean() {
    await sql`TRUNCATE TABLE matches RESTART IDENTITY`;
    console.log('Matches table cleaned.');
    process.exit(0);
}

clean();
