import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth, firestore } from '@/lib/firebase-admin';

// This endpoint returns premium stream URLs for authenticated premium users
// The Flutter app should send Firebase ID token in the Authorization header

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid Authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const body = await request.json();
        const { type, id } = body; // type: 'channel' | 'match' | 'goal' | 'news'

        if (!type || !id) {
            return NextResponse.json(
                { success: false, error: 'Missing type or id in request body' },
                { status: 400 }
            );
        }

        // 1. Verify Firebase Token
        let userId: string;
        try {
            const decodedToken = await auth.verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (error) {
            console.error('Firebase token verification error:', error);
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid token' },
                { status: 401 }
            );
        }

        // 2. Check Subscription Status in Firestore
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const isSubscribed = userData?.isSubscribed === true;

        if (!isSubscribed) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: User is not a premium subscriber' },
                { status: 403 }
            );
        }

        // 3. Fetch the full data with premium URLs
        let data = null;

        switch (type) {
            case 'channel':
                const [channel] = await sql`SELECT * FROM channels WHERE id = ${id}`;
                data = channel;
                break;
            case 'match':
                const [match] = await sql`SELECT * FROM matches WHERE id = ${id}`;
                data = match;
                break;
            case 'goal':
                const [goal] = await sql`SELECT * FROM goals WHERE id = ${id}`;
                data = goal;
                break;
            case 'news':
                const [newsItem] = await sql`SELECT * FROM news WHERE id = ${id}`;
                data = newsItem;
                break;
            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid type' },
                    { status: 400 }
                );
        }

        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Item not found' },
                { status: 404 }
            );
        }

        // Return full data including premium URLs
        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Premium access error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
