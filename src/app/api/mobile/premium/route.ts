import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

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

        // TODO: Verify Firebase token and check premium subscription
        // For now, we'll use a simple token check
        // In production, use Firebase Admin SDK to verify the token

        // Placeholder: Check if token is valid (implement Firebase verification)
        const isPremiumUser = await verifyPremiumUser(token);

        if (!isPremiumUser) {
            return NextResponse.json(
                { success: false, error: 'User is not a premium subscriber' },
                { status: 403 }
            );
        }

        // Fetch the full data with premium URLs
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

// Placeholder function - implement Firebase verification
async function verifyPremiumUser(token: string): Promise<boolean> {
    // TODO: Implement actual Firebase token verification
    // 1. Verify token with Firebase Admin SDK
    // 2. Get user ID from token
    // 3. Check Firestore for user's subscription status

    // For testing, accept a specific test token
    if (token === 'TEST_PREMIUM_TOKEN') {
        return true;
    }

    // In production, implement proper verification:
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // const userId = decodedToken.uid;
    // const userDoc = await admin.firestore().collection('users').doc(userId).get();
    // return userDoc.data()?.isPremium === true;

    return false;
}
