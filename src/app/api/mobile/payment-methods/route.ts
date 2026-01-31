import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        let methods;
        try {
            methods = await sql`
                SELECT id, name, number, instructions, image, input_label 
                FROM payment_methods 
                WHERE is_active = true 
                ORDER BY id ASC
            `;
        } catch (colError) {
            console.warn('Fallback: input_label missing in DB');
            methods = await sql`
                SELECT id, name, number, instructions, image 
                FROM payment_methods 
                WHERE is_active = true 
                ORDER BY id ASC
            `;
            methods = methods.map(m => ({ ...m, input_label: 'رقم المحفظة / Account Number' }));
        }
        return NextResponse.json(methods || []);
    } catch (error: any) {
        console.error('CRITICAL Payment Methods API Error:', error);
        return NextResponse.json({
            error: 'Failed to access database',
            details: error.message
        }, { status: 500 });
    }
}
