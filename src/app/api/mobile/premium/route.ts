import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth, firestore } from '@/lib/firebase-admin';
import { processStreams, StreamAccessLevel } from '@/lib/stream-utils';

// This endpoint returns stream URLs based on user subscription
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

        // 2. Check Subscription Status in PostgreSQL (Primary Source)
        // We now ALLOW non-subscribers to access, but we filter their content.
        let isSubscribed = false;
        try {
            const userRows = await sql`SELECT subscription_end FROM users WHERE id = ${userId}`;
            if (userRows.length > 0) {
                const subEnd = new Date(userRows[0].subscription_end);
                if (subEnd > new Date()) {
                    isSubscribed = true;
                }
            }
        } catch (error) {
            console.error('Error fetching user subscription from DB:', error);
            // Default to false (not subscribed)
        }

        // Determine Access Level
        const accessLevel: StreamAccessLevel = isSubscribed ? 'premium' : 'user';

        // 3. Fetch the content
        let data: any = null;

        switch (type) {
            case 'channel':
                const [channel] = await sql`SELECT * FROM channels WHERE id = ${id}`;
                if (channel) {
                    channel.stream_link = processStreams(channel.stream_link || [], accessLevel);
                    data = channel;
                }
                break;
            case 'match':
                const [match] = await sql`SELECT * FROM matches WHERE id = ${id}`;
                if (match) {
                    match.stream_link = processStreams(match.stream_link || [], accessLevel);
                    data = match;
                }
                break;
            case 'goal':
                const [goal] = await sql`SELECT * FROM goals WHERE id = ${id}`;
                // Future: Add stream processing if goals have premium links
                data = goal;
                break;
            case 'news':
                const [newsItem] = await sql`SELECT * FROM news WHERE id = ${id}`;
                // Future: Add stream processing if news has premium links
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

        // Return data with filtered URLs
        return NextResponse.json({
            success: true,
            is_subscribed: isSubscribed, // Helpful for client debugging
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
