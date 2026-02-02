import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const highlights = await sql`
            SELECT * FROM highlights 
            WHERE is_published = true
            ORDER BY created_at DESC
        `;

        const formattedHighlights = highlights.map(item => {
            // Unpack image array if needed
            let image = item.image;
            if (Array.isArray(image) && image.length > 0) {
                image = image[0];
            }

            // Unpack URL: could be string, single object, or array of servers
            let sources: { name: string, url: string }[] = [];
            let primaryUrl = '';

            let rawUrl = item.url;
            if (rawUrl) {
                if (typeof rawUrl === 'string' && (rawUrl.trim().startsWith('{') || rawUrl.trim().startsWith('['))) {
                    try { rawUrl = JSON.parse(rawUrl); } catch (e) { }
                }

                if (Array.isArray(rawUrl)) {
                    sources = rawUrl;
                    primaryUrl = rawUrl[0]?.url || '';
                } else if (typeof rawUrl === 'object' && rawUrl.url) {
                    sources = [{ name: 'Server 1', url: rawUrl.url }];
                    primaryUrl = rawUrl.url;
                } else if (typeof rawUrl === 'string') {
                    sources = [{ name: 'Server 1', url: rawUrl }];
                    primaryUrl = rawUrl;
                }
            }

            return {
                id: item.id,
                title: item.title,
                image: image,
                url: primaryUrl, // Backward compatibility
                sources: sources, // New multi-link support
                is_premium: item.is_premium,
                created_at: item.created_at
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedHighlights
        });
    } catch (error) {
        console.error('Error fetching highlights:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch highlights' }, { status: 500 });
    }
}
