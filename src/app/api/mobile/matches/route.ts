import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { processStreams, StreamAccessLevel } from '@/lib/stream-utils';

const DEBUG_SECRET = '7esen';

// GET /api/mobile/matches
// Add ?secret=... to bypass premium protection (for debugging)
export async function GET(request: NextRequest) {
    try {
        // Check for debug secret
        const secret = request.nextUrl.searchParams.get('secret');
        const accessLevel: StreamAccessLevel = secret === DEBUG_SECRET ? 'premium' : 'public';

        const matches = await sql`
            SELECT * FROM matches 
            WHERE is_published = true
            ORDER BY created_at DESC
        `;

        // Filter premium streams from each match
        const filteredMatches = matches.map(match => {
            const getLogo = (logo: any) => {
                if (!logo) return null;
                if (Array.isArray(logo)) return logo[0];
                return logo;
            };

            return {
                id: match.id,
                team_a: match.team_a,
                team_b: match.team_b,
                logo_a: getLogo(match.logo_a),
                logo_b: getLogo(match.logo_b),
                match_time: match.match_time,
                channel: match.channel,
                commentator: match.commentator,
                champion: match.champion,
                is_premium: match.is_premium,
                stream_link: processStreams(match.stream_link || [], accessLevel),
                created_at: match.created_at
            };
        });

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
