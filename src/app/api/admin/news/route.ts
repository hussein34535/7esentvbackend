import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';

const ADMIN_SECRET = '7esen';

// POST /api/admin/news - Create a news article
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret, title, image, link, is_premium, is_published } = body;

        // Verify admin secret
        if (secret !== ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!title) {
            return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
        }

        // Insert news
        const result = await sql`
            INSERT INTO news (
                title, image, link, is_premium, is_published, 
                date, created_at, updated_at
            )
            VALUES (
                ${title}, 
                ${image ? JSON.stringify(image) : null}::jsonb, 
                ${link ? JSON.stringify(link) : null}::jsonb, 
                ${is_premium || false}, 
                ${is_published ?? true}, 
                now(), 
                now(), 
                now()
            )
            RETURNING id
        `;

        revalidatePath('/news');
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            id: result[0].id,
            message: 'News article created successfully'
        });
    } catch (error: any) {
        console.error('Error creating news:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create news article' }, { status: 500 });
    }
}
