require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

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
const API_BASE = 'https://st9.onrender.com/api';

function transformImage(strapiImageField) {
    if (!strapiImageField) return null;
    const rawData = strapiImageField.data || strapiImageField;
    if (!rawData) return null;
    const items = Array.isArray(rawData) ? rawData : [rawData];
    return items.map(item => {
        const attr = item.attributes || item;
        return {
            id: item.id,
            name: attr.name,
            hash: attr.hash,
            ext: attr.ext,
            mime: attr.mime,
            width: attr.width,
            height: attr.height,
            size: attr.size,
            url: attr.url,
            provider: attr.provider,
            createdAt: attr.createdAt,
            updatedAt: attr.updatedAt
        };
    });
}

async function fetchAPI(endpoint) {
    const url = `${API_BASE}${endpoint}`;
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        console.log(`   > Received ${json.data?.length || 0} items.`);
        return json.data || [];
    } catch (e) {
        console.error(`Error fetching ${endpoint}:`, e);
        return [];
    }
}

async function restoreNews() {
    console.log('🚀 Restoring News from API...');

    try {
        // Clear only news table
        console.log('🧹 Clearing news table...');
        await sql`TRUNCATE news RESTART IDENTITY CASCADE`;
        console.log('✅ News table cleared.');

        // Fetch and insert news
        console.log('\n--- Fetching News from API ---');
        const news = await fetchAPI('/news?populate=*');

        for (const item of news) {
            const attr = item.attributes || item;
            const image = transformImage(attr.image);
            try {
                await sql`
                    INSERT INTO news (title, image, link, is_premium, is_published, date, created_at, updated_at)
                    VALUES (
                        ${attr.title}, 
                        ${image ? sql.json(image) : null}, 
                        ${attr.link ? JSON.stringify(attr.link) : null}, 
                        ${attr.is_premium || false}, 
                        true, 
                        ${attr.date || attr.createdAt},
                        ${attr.createdAt}, 
                        ${attr.updatedAt}
                    )
                `;
                process.stdout.write('.');
            } catch (e) {
                console.error('\nError inserting news:', e);
            }
        }

        console.log('\n\n✅ News Restored!');

        // Show final count
        const [count] = await sql`SELECT count(*) FROM news`;
        console.log(`📰 Total News: ${count.count}`);

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

restoreNews();
