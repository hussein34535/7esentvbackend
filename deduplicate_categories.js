
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;
    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
        connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
    }
}
const sql = postgres(connectionString, { ssl: 'require' });

async function deduplicate() {
    console.log('🚀 Starting Category Deduplication...');

    // 1. Find duplicates
    // We group by lowercased name just in case, though the previous check showed exact matches
    const duplicateGroups = await sql`
        SELECT name, array_agg(id) as ids 
        FROM channel_categories 
        GROUP BY name 
        HAVING COUNT(*) > 1
    `;

    if (duplicateGroups.length === 0) {
        console.log('✅ No duplicates found! Your data is clean.');
        process.exit(0);
    }

    console.log(`Found ${duplicateGroups.length} duplicated category names.`);

    for (const group of duplicateGroups) {
        const { name, ids } = group;
        // Keep the first ID as master (usually the oldest if IDs are serial, or just efficient)
        // Actually, let's keep the one with most relations? 
        // No, simplest is keep oldest (lowest ID) to preserve original if possible, 
        // or just first. The order in array_agg is not guaranteed unless specified, but usually it's row order.
        // Let's sort IDs to be deterministic.
        const sortedIds = ids.sort((a, b) => a - b);
        const masterId = sortedIds[0];
        const duplicatesToRemove = sortedIds.slice(1);

        console.log(`\nMerging "${name}"...`);
        console.log(`   Master ID: ${masterId}`);
        console.log(`   Removing: ${duplicatesToRemove.join(', ')}`);

        for (const dupId of duplicatesToRemove) {
            // 1. Check relations of the duplicate
            const rels = await sql`SELECT channel_id FROM _rel_channels_categories WHERE category_id = ${dupId}`;

            if (rels.length > 0) {
                process.stdout.write(`   - Moving ${rels.length} links from ${dupId}... `);
                for (const { channel_id } of rels) {
                    // Link to master if not exists
                    const [exists] = await sql`SELECT 1 FROM _rel_channels_categories WHERE category_id = ${masterId} AND channel_id = ${channel_id}`;
                    if (!exists) {
                        await sql`INSERT INTO _rel_channels_categories (channel_id, category_id) VALUES (${channel_id}, ${masterId})`;
                    }
                }
                // Delete old relations for this dup
                await sql`DELETE FROM _rel_channels_categories WHERE category_id = ${dupId}`;
                process.stdout.write('Done.\n');
            }

            // 2. Delete the duplicate category itself
            await sql`DELETE FROM channel_categories WHERE id = ${dupId}`;
            console.log(`   - Deleted Category ID ${dupId}`);
        }
    }

    console.log('\n✅ Deduplication Complete!');
    process.exit(0);
}

deduplicate().catch(e => {
    console.error(e);
    process.exit(1);
});
