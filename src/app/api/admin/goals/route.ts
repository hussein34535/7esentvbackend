import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';

const ADMIN_SECRET = '7esen';

// POST /api/admin/goals - Create a goal video
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

        // Handle URL format: ensure it's stored as JSON if that's the convention
        // Based on UI: { url: "...", type: "video" }
        let goalUrl = url;
        if (typeof url === 'string') {
            goalUrl = { url: url, type: 'video' };
        }

        // Insert goal
        const result = await sql`
            INSERT INTO goals (
                title, image, url, is_premium, is_published,
                time, created_at, updated_at
            )
            VALUES (
                ${title}, 
                ${image ? JSON.stringify(image) : null}::jsonb, 
                ${JSON.stringify(goalUrl)}::jsonb, 
                ${is_premium || false}, 
                ${is_published ?? true}, 
                now(), 
                now(), 
                now()
            )
            RETURNING id
        `;

        revalidatePath('/goals');
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            id: result[0].id,
            message: 'Goal created successfully'
        });
    } catch (error: any) {
        console.error('Error creating goal:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create goal' }, { status: 500 });
    }
}
