import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Auth required: only the owner may read their own status.
        // The Flutter app already sends: Authorization: Bearer <firebaseIdToken>
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let verifiedUid: string;
        try {
            const idToken = authHeader.slice('Bearer '.length).trim();
            const decoded = await auth.verifyIdToken(idToken);
            verifiedUid = decoded.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        // Verified uid must match the requested uid
        if (verifiedUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
