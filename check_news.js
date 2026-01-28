require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function checkNews() {
    const { DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD } = process.env;
    const dbConfig = {
        host: DATABASE_HOST,
        port: Number(DATABASE_PORT),
        database: DATABASE_NAME,
        username: DATABASE_USERNAME,
        password: DATABASE_PASSWORD,
        ssl: 'require'
    };

    const sql = postgres(dbConfig);

    try {
        const count = await sql`SELECT count(*) FROM news`;
        console.log('📰 Total News Articles:', count[0].count);

        const latest = await sql`SELECT title, date FROM news ORDER BY id DESC LIMIT 5`;
        console.log('--- Latest 5 Articles ---');
        latest.forEach(n => console.log(`- ${n.title} (${n.date})`));

    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

checkNews();
