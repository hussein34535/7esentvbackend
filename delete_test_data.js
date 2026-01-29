// Delete all test/verify data from all tables

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

async function deleteTestData() {
    console.log('🗑️  Deleting test/verify data...\n');

    // Define patterns to match test data
    const patterns = ['%Verify%', '%Test%'];

    // 1. Delete test channels
    console.log('📺 Channels:');
    for (const pattern of patterns) {
        // First delete relationships
        const channelsToDelete = await sql`
            SELECT id FROM channels WHERE name ILIKE ${pattern}
        `;
        if (channelsToDelete.length > 0) {
            const ids = channelsToDelete.map(c => c.id);
            await sql`DELETE FROM _rel_channels_categories WHERE channel_id = ANY(${ids}::bigint[])`;
            const result = await sql`DELETE FROM channels WHERE name ILIKE ${pattern}`;
            console.log(`   ✅ Deleted ${channelsToDelete.length} channels matching "${pattern}"`);
        }
    }

    // 2. Delete test categories
    console.log('\n📁 Categories:');
    for (const pattern of patterns) {
        // First delete relationships
        const categoriesToDelete = await sql`
            SELECT id FROM channel_categories WHERE name ILIKE ${pattern}
        `;
        if (categoriesToDelete.length > 0) {
            const ids = categoriesToDelete.map(c => c.id);
            await sql`DELETE FROM _rel_channels_categories WHERE category_id = ANY(${ids}::bigint[])`;
            const result = await sql`DELETE FROM channel_categories WHERE name ILIKE ${pattern}`;
            console.log(`   ✅ Deleted ${categoriesToDelete.length} categories matching "${pattern}"`);
        }
    }

    // 3. Delete test matches
    console.log('\n⚽ Matches:');
    for (const pattern of patterns) {
        const result = await sql`DELETE FROM matches WHERE team_a ILIKE ${pattern} OR team_b ILIKE ${pattern}`;
        if (result.count > 0) {
            console.log(`   ✅ Deleted ${result.count} matches matching "${pattern}"`);
        }
    }

    // 4. Delete test news
    console.log('\n📰 News:');
    for (const pattern of patterns) {
        const result = await sql`DELETE FROM news WHERE title ILIKE ${pattern}`;
        if (result.count > 0) {
            console.log(`   ✅ Deleted ${result.count} news matching "${pattern}"`);
        }
    }

    // 5. Delete test goals
    console.log('\n🎯 Goals:');
    for (const pattern of patterns) {
        const result = await sql`DELETE FROM goals WHERE title ILIKE ${pattern}`;
        if (result.count > 0) {
            console.log(`   ✅ Deleted ${result.count} goals matching "${pattern}"`);
        }
    }

    console.log('\n🎉 Test data cleanup complete!');
    await sql.end();
}

deleteTestData().catch(console.error);
