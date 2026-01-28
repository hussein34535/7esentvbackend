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

        // Map channels with parsed streams
        const filteredChannels = channels.map(channel => {
            // Check if any category is premium
            const hasPremiumCategory = (channel.categories || []).some((cat: any) => cat.is_premium === true);

            return {
                id: channel.id,
                name: channel.name,
                logo: channel.logo,
                categories: channel.categories,
                stream_link: parseStreamLinks(channel.stream_link || [], hasPremiumCategory),
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
