import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Parse Strapi Rich Text format and extract streams
function parseStreamLinks(richText: any[]): { name: string; url: string | null; is_premium: boolean }[] {
    if (!richText || !Array.isArray(richText)) return [];

    const streams: { name: string; url: string | null; is_premium: boolean }[] = [];

    for (const paragraph of richText) {
        if (paragraph.type === 'paragraph' && paragraph.children) {
            for (const child of paragraph.children) {
                if (child.type === 'link' && child.url) {
                    let name = '';
                    if (child.children && child.children.length > 0) {
                        name = child.children.map((c: any) => c.text || '').join('').trim();
                    }

                    if (!name && !child.url) continue;

                    const isPremium = name.toLowerCase().includes('premium') ||
                        name.toLowerCase().includes('4k');

                    streams.push({
                        name: name || 'Stream',
                        url: isPremium ? null : child.url,
                        is_premium: isPremium
                    });
                }
            }
        }
    }

    return streams;
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
            stream_link: parseStreamLinks(match.stream_link || []),
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
