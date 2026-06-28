import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, email } = body;

        if (!uid || !email) {
            return NextResponse.json({ error: 'UID and Email are required' }, { status: 400 });
        }

        // Insert user into PostgreSQL if they don't exist
        await sql`
            INSERT INTO users (id, email, status, joined_at, last_active_at, updated_at)
            VALUES (${uid}, ${email}, 'active', now(), now(), now())
            ON CONFLICT (id) DO NOTHING
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Register API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
