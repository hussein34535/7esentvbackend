import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';

const ADMIN_SECRET = '7esen';

// POST /api/admin/matches - Create a match
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret, team_a, team_b, match_time, channel, commentator, champion, logo_a, logo_b, is_premium, is_published, stream_link } = body;

        // Verify admin secret
        if (secret !== ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!team_a || !team_b || !match_time) {
            return NextResponse.json({ error: 'Missing required fields: team_a, team_b, match_time' }, { status: 400 });
        }

        // Insert match
        const result = await sql`
            INSERT INTO matches (
                team_a, team_b, match_time, channel, commentator, champion, 
                logo_a, logo_b, is_premium, is_published, stream_link, 
                created_at, updated_at
            )
            VALUES (
                ${team_a}, 
                ${team_b}, 
                ${match_time}, 
                ${channel || null}, 
                ${commentator || null}, 
                ${champion || null}, 
                ${logo_a ? JSON.stringify(logo_a) : null}::jsonb, 
                ${logo_b ? JSON.stringify(logo_b) : null}::jsonb, 
                ${is_premium || false}, 
                ${is_published ?? true}, 
                ${stream_link ? JSON.stringify(stream_link) : null}::jsonb, 
                now(), 
                now()
            )
            RETURNING id
        `;

        revalidatePath('/');
        revalidatePath('/matches');

        return NextResponse.json({
            success: true,
            id: result[0].id,
            message: 'Match created successfully'
        });
    } catch (error: any) {
        console.error('Error creating match:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create match' }, { status: 500 });
    }
}
