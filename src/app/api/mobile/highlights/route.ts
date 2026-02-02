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

            // Unpack URL if it's stored as {url: '...', type: 'video'}
            let url = item.url;
            if (url && typeof url === 'object' && url.url) {
                url = url.url;
            }

            return {
                id: item.id,
                title: item.title,
                image: image,
                url: url, // Direct link
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
