import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const packages = await sql`
            SELECT id, name, description, price, duration_days, features 
            FROM packages 
            WHERE is_active = true 
            ORDER BY price ASC
        `;
        return NextResponse.json(packages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}
