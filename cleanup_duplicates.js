// Cleanup script to remove duplicate channels
// Keeps the channel with the most stream links for each name

import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '6543'),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    ssl: 'require'
});

async function cleanupDuplicates() {
    console.log('🔍 Finding duplicate channels...\n');

    // Find all channels grouped by name
    const channels = await sql`
        SELECT id, name, stream_link
        FROM channels
        ORDER BY name, id
    `;

    // Group by name
    const groups = {};
    for (const ch of channels) {
        if (!groups[ch.name]) {
            groups[ch.name] = [];
        }
        groups[ch.name].push(ch);
    }

    // Find duplicates
    const toDelete = [];
    let keptCount = 0;

    for (const [name, items] of Object.entries(groups)) {
        if (items.length > 1) {
            console.log(`📺 "${name}" has ${items.length} duplicates`);

            // Sort by stream_link length (most links first), then by ID (lowest first)
            items.sort((a, b) => {
                const aLinks = Array.isArray(a.stream_link) ? a.stream_link.length : 0;
                const bLinks = Array.isArray(b.stream_link) ? b.stream_link.length : 0;
                if (bLinks !== aLinks) return bLinks - aLinks; // More links = better
                return parseInt(a.id) - parseInt(b.id); // Lower ID = older = keep
            });

            // Keep the first one (most links or oldest)
            const keep = items[0];
            const deleteThese = items.slice(1);

            console.log(`   ✅ Keep ID ${keep.id} (${Array.isArray(keep.stream_link) ? keep.stream_link.length : 0} links)`);
            for (const d of deleteThese) {
                console.log(`   ❌ Delete ID ${d.id} (${Array.isArray(d.stream_link) ? d.stream_link.length : 0} links)`);
                toDelete.push(d.id);
            }
            keptCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Unique channel names: ${Object.keys(groups).length}`);
    console.log(`   - Duplicates to delete: ${toDelete.length}`);

    if (toDelete.length === 0) {
        console.log('\n✅ No duplicates found!');
        await sql.end();
        return;
    }

    // Ask for confirmation
    console.log('\n⚠️  Deleting duplicates...');

    // Delete relationships first
    await sql`
        DELETE FROM _rel_channels_categories
        WHERE channel_id = ANY(${toDelete}::bigint[])
    `;
    console.log('   ✅ Deleted category relationships');

    // Delete channels
    await sql`
        DELETE FROM channels
        WHERE id = ANY(${toDelete}::bigint[])
    `;
    console.log('   ✅ Deleted duplicate channels');

    console.log('\n🎉 Cleanup complete!');
    await sql.end();
}

cleanupDuplicates().catch(console.error);
