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

// GET /api/mobile/matches
export async function GET() {
    try {
        const matches = await sql`
            SELECT * FROM matches 
            WHERE is_published = true
            ORDER BY created_at DESC
        `;

        // Filter premium streams from each match
        const filteredMatches = matches.map(match => ({
            id: match.id,
            team_a: match.team_a,
            team_b: match.team_b,
            logo_a: match.logo_a,
            logo_b: match.logo_b,
            match_time: match.match_time,
            channel: match.channel,
            commentator: match.commentator,
            champion: match.champion,
            is_premium: match.is_premium,
            stream_link: filterPremiumStreams(match.stream_link || []),
            created_at: match.created_at
        }));

        return NextResponse.json({
            success: true,
            data: filteredMatches
        });
    } catch (error) {
        console.error('Error fetching matches:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch matches' },
            { status: 500 }
        );
    }
}
