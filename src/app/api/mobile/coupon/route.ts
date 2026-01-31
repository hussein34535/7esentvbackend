import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ valid: false, message: 'Invalid code' });
        }

        const rows = await sql`
            SELECT * FROM promo_codes 
            WHERE code = ${code.toUpperCase()} 
            AND is_active = true
        `;

        if (rows.length === 0) {
            return NextResponse.json({ valid: false, message: 'Invalid or expired code' });
        }

        const coupon = rows[0];

        // Check expiration
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return NextResponse.json({ valid: false, message: 'Code expired' });
        }

        // Check usage limit
        if (coupon.max_uses !== -1 && coupon.used_count >= coupon.max_uses) {
            return NextResponse.json({ valid: false, message: 'Code usage limit reached' });
        }

        return NextResponse.json({
            valid: true,
            discount_percent: coupon.discount_percent,
            code: coupon.code
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to check coupon' }, { status: 500 });
    }
}
