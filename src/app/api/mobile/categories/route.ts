import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /api/mobile/categories
export async function GET() {
    try {
        const categories = await sql`
            SELECT * FROM channel_categories 
            ORDER BY sort_order ASC, name ASC
        `;

        return NextResponse.json({
            success: true,
            data: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                is_premium: cat.is_premium,
                sort_order: cat.sort_order,
                image: cat.image ? (cat.image.secure_url || cat.image.url) : null
            }))
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
