import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        let packages;
        try {
            packages = await sql`
                SELECT id, name, description, price, sale_price, duration_days, duration_months, discount_months, features 
                FROM packages 
                WHERE is_active = true 
                ORDER BY price ASC
            `;
        } catch (colError) {
            console.warn('Fallback: sale_price missing in DB');
            packages = await sql`
                SELECT id, name, description, price, duration_days, features 
                FROM packages 
                WHERE is_active = true 
                ORDER BY price ASC
            `;
            packages = packages.map(p => ({ ...p, sale_price: null, duration_months: 1, discount_months: 0 }));
        }
        return NextResponse.json(packages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}
