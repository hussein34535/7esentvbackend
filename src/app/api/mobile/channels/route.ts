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
                    // Get the link text (name)
                    let name = '';
                    if (child.children && child.children.length > 0) {
                        name = child.children.map((c: any) => c.text || '').join('').trim();
                    }

                    // Skip empty links
                    if (!name && !child.url) continue;

                    // Check if premium (you can customize this logic)
                    // For now, checking if name contains "premium" or "4k"
                    const isPremium = name.toLowerCase().includes('premium') ||
                        name.toLowerCase().includes('4k');

                    streams.push({
                        name: name || 'Stream',
                        url: isPremium ? null : child.url, // Hide URL if premium
                        is_premium: isPremium
                    });
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

        // Filter premium streams from each channel
        const filteredChannels = channels.map(channel => ({
            id: channel.id,
            name: channel.name,
            logo: channel.logo,
            categories: channel.categories,
            stream_link: parseStreamLinks(channel.stream_link || []),
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
