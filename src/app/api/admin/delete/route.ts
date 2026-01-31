import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

const ADMIN_SECRET = '7esen';

// POST /api/admin/delete - Bulk delete items
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret, type, ids } = body;

        // Verify admin secret
        if (secret !== ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid request: type and ids required' }, { status: 400 });
        }

        let deletedCount = 0;

        switch (type) {
            case 'channels':
                // Delete relationships first
                await sql`DELETE FROM _rel_channels_categories WHERE channel_id = ANY(${ids}::bigint[])`;
                const chResult = await sql`DELETE FROM channels WHERE id = ANY(${ids}::bigint[])`;
                deletedCount = chResult.count;
                break;

            case 'categories':
                // Delete relationships first
                await sql`DELETE FROM _rel_channels_categories WHERE category_id = ANY(${ids}::bigint[])`;
                const catResult = await sql`DELETE FROM channel_categories WHERE id = ANY(${ids}::bigint[])`;
                deletedCount = catResult.count;
                break;

            case 'matches':
                const matchResult = await sql`DELETE FROM matches WHERE id = ANY(${ids}::bigint[])`;
                deletedCount = matchResult.count;
                break;

            case 'news':
                const newsResult = await sql`DELETE FROM news WHERE id = ANY(${ids}::bigint[])`;
                deletedCount = newsResult.count;
                break;

            case 'goals':
                const goalResult = await sql`DELETE FROM goals WHERE id = ANY(${ids}::bigint[])`;
                deletedCount = goalResult.count;
                break;

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            deleted: deletedCount,
            message: `Deleted ${deletedCount} ${type}`
        });
    } catch (error) {
        console.error('Error deleting items:', error);
        return NextResponse.json({ error: 'Failed to delete items' }, { status: 500 });
    }
}
