const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
  try {
    const { rows } = await sql`SELECT id, email, status, subscription_end, updated_at FROM users ORDER BY updated_at DESC LIMIT 5`;
    console.log("Recent DB updates:", rows);
  } catch (e) {
    console.error(e);
  }
}

check();
