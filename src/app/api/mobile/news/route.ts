import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /api/mobile/news
export async function GET() {
    try {
        const news = await sql`
            SELECT * FROM news 
            WHERE is_published = true
            ORDER BY created_at DESC
        `;

        // Filter premium content and clean up link
        const filteredNews = news.map(item => {
            let cleanLink = item.link;

            // Unpack if stringified JSON
            if (typeof cleanLink === 'string' && (cleanLink.trim().startsWith('{') || cleanLink.trim().startsWith('['))) {
                try {
                    const parsed = JSON.parse(cleanLink);
                    if (parsed.url) cleanLink = parsed.url;
                    else if (parsed.link) cleanLink = parsed.link;
                } catch (e) { /* ignore */ }
            }
            // Unpack if already object
            else if (typeof cleanLink === 'object' && cleanLink?.url) {
                cleanLink = cleanLink.url;
            } else if (typeof cleanLink === 'object' && cleanLink?.link) {
                cleanLink = cleanLink.link;
            }

            return {
                id: item.id,
                title: item.title,
                image: item.image,
                date: item.date,
                is_premium: item.is_premium,
                // Only show link if not premium
                link: item.is_premium ? null : cleanLink,
                created_at: item.created_at
            };
        });

        return NextResponse.json({
            success: true,
            data: filteredNews
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}
