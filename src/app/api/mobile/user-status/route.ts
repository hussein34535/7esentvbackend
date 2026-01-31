import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const rows = await sql`
            SELECT id, email, subscription_end, status, plan_id 
            FROM users 
            WHERE id = ${uid}
        `;

        if (rows.length === 0) {
            return NextResponse.json({
                isSubscribed: false,
                status: 'none',
                subscriptionEnd: null
            });
        }

        const user = rows[0];
        const isSubscribed = user.status === 'active' &&
            user.subscription_end &&
            new Date(user.subscription_end) > new Date();

        return NextResponse.json({
            uid: user.id,
            email: user.email,
            status: user.status,
            subscriptionEnd: user.subscription_end,
            isSubscribed: isSubscribed,
            planId: user.plan_id
        });

    } catch (error) {
        console.error('User Status API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
