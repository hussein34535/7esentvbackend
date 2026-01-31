import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const methods = await sql`
            SELECT id, name, number, instructions, image, input_label 
            FROM payment_methods 
            WHERE is_active = true 
            ORDER BY id ASC
        `;
        return NextResponse.json(methods || []);
    } catch (error: any) {
        console.error('Payment Methods API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch payment methods',
            details: error.message,
            hint: 'Check if DATABASE_URL is correct in the server environment'
        }, { status: 500 });
    }
}
