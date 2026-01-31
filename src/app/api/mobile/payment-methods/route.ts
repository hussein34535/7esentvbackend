import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const methods = await sql`
            SELECT id, name, number, instructions, image 
            FROM payment_methods 
            WHERE is_active = true 
            ORDER BY id ASC
        `;
        return NextResponse.json(methods);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }
}
