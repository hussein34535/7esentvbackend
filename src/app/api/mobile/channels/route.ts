import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Helper function to filter premium streams
function filterPremiumStreams(streams: any[]) {
    if (!streams || !Array.isArray(streams)) return [];

    return streams.map(stream => {
        if (stream.is_premium) {
            // Premium: return name only, hide URL
            return {
                name: stream.name,
                is_premium: true,
                url: null // Hide the actual URL
            };
        } else {
            // Free: return everything
            return {
                name: stream.name,
                is_premium: false,
                url: stream.url
            };
        }
    });
}

// GET /api/mobile/channels
export async function GET() {
    try {
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

        // Filter premium streams from each channel
        const filteredChannels = channels.map(channel => ({
            id: channel.id,
            name: channel.name,
            logo: channel.logo,
            categories: channel.categories,
            stream_link: filterPremiumStreams(channel.stream_link || []),
            created_at: channel.created_at
        }));

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
