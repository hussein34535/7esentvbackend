import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Parse stream links - handles both Strapi Rich Text and new JSON format
function parseStreamLinks(data: any, defaultPremium: boolean): { name: string; url?: string | null; is_premium: boolean }[] {
    if (!data || !Array.isArray(data)) return [];

    const streams: { name: string; url?: string | null; is_premium: boolean }[] = [];

    for (const item of data) {
        // New format: { name, url, is_premium }
        if (item.url && !item.type) {
            const isPremium = item.is_premium === true;
            if (isPremium) {
                streams.push({
                    name: item.name || 'Stream',
                    is_premium: true
                    // url is omitted entirely
                });
            } else {
                streams.push({
                    name: item.name || 'Stream',
                    url: item.url,
                    is_premium: false
                });
            }
        }
        // Old Strapi Rich Text format
        else if (item.type === 'paragraph' && item.children) {
            for (const child of item.children) {
                if (child.type === 'link' && child.url) {
                    let name = '';
                    if (child.children && child.children.length > 0) {
                        name = child.children.map((c: any) => c.text || '').join('').trim();
                    }

                    if (!name && !child.url) continue;

                    if (defaultPremium) {
                        streams.push({
                            name: name || 'Stream',
                            is_premium: true
                            // url is omitted entirely
                        });
                    } else {
                        streams.push({
                            name: name || 'Stream',
                            url: child.url,
                            is_premium: false
                        });
                    }
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
            stream_link: parseStreamLinks(match.stream_link || [], match.is_premium === true),
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
