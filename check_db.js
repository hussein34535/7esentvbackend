const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function check() {
    const matches = await sql`SELECT id, team_a, team_b, created_at FROM matches`;
    console.log(`Found ${matches.length} matches.`);
    matches.forEach(m => console.log(`- [${m.id}] ${m.team_a} vs ${m.team_b} (${m.created_at})`));
    process.exit(0);
}

check();
