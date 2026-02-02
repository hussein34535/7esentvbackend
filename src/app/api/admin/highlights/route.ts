import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';

const ADMIN_SECRET = '7esen';

// POST /api/admin/highlights - Create a highlight from external app
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret, title, image, url, is_premium, is_published } = body;

        // Verify admin secret
        if (secret !== ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!title || !url) {
            return NextResponse.json({ error: 'Missing required fields: title or url' }, { status: 400 });
        }

        // Handle URL format: ensure it's stored as JSON
        let highlightUrl = url;
        if (typeof url === 'string') {
            highlightUrl = { url: url, type: 'video' };
        }

        // Insert highlight
        const result = await sql`
            INSERT INTO highlights (
                title, image, url, is_premium, is_published,
                created_at, updated_at
            )
            VALUES (
                ${title}, 
                ${image ? JSON.stringify(image) : null}::jsonb, 
                ${JSON.stringify(highlightUrl)}::jsonb, 
                ${is_premium || false}, 
                ${is_published ?? true}, 
                now(), 
                now()
            )
            RETURNING id
        `;

        revalidatePath('/highlights');
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            id: result[0].id,
            message: 'Highlight created successfully'
        });
    } catch (error: any) {
        console.error('Error creating highlight:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create highlight' }, { status: 500 });
    }
}
