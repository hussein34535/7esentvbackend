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

        // Filter premium content
        const filteredNews = news.map(item => ({
            id: item.id,
            title: item.title,
            image: item.image,
            date: item.date,
            is_premium: item.is_premium,
            // Only show link if not premium
            link: item.is_premium ? null : item.link,
            created_at: item.created_at
        }));

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
