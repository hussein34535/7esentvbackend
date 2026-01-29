import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { processStreams, StreamAccessLevel } from '@/lib/stream-utils';

const DEBUG_SECRET = 'GHWDpKHoAZdRn14eqjrNIJbaxOK2';

// GET /api/mobile/channels
// Add ?secret=... to bypass premium protection (for debugging)
export async function GET(request: NextRequest) {
    try {
        // Check for debug secret
        const secret = request.nextUrl.searchParams.get('secret');
        const accessLevel: StreamAccessLevel = secret === DEBUG_SECRET ? 'premium' : 'public';

        const channels = await sql`
            SELECT c.*, 
                   COALESCE(
                       json_agg(
                           json_build_object('id', cat.id, 'name', cat.name, 'is_premium', cat.is_premium)
                       ) FILTER (WHERE cat.id IS NOT NULL), 
                       '[]'
                   ) as categories
            FROM channels c
            LEFT JOIN _rel_channels_categories rel ON c.id = rel.channel_id
            LEFT JOIN channel_categories cat ON rel.category_id = cat.id
            GROUP BY c.id
            ORDER BY c.name ASC
        `;

        // Map channels with processStreams
        const filteredChannels = channels.map(channel => {
            return {
                id: channel.id,
                name: channel.name,
                logo: channel.logo,
                categories: channel.categories,
                stream_link: processStreams(channel.stream_link || [], accessLevel),
                created_at: channel.created_at
            };
        });

        return NextResponse.json({
            success: true,
            data: filteredChannels
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}
