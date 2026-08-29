import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        // Spam protection: require a valid Firebase ID token and force the
        // body uid to match the verified uid. The Flutter app already sends
        // Authorization: Bearer <firebaseIdToken> at register time.
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

        const body = await request.json();
        const { uid, email } = body;

        if (!uid || !email) {
            return NextResponse.json({ error: 'UID and Email are required' }, { status: 400 });
        }

        if (uid !== verifiedUid) {
            return NextResponse.json({ error: 'Forbidden: uid mismatch' }, { status: 403 });
        }

        // Insert user into PostgreSQL if they don't exist
        await sql`
            INSERT INTO users (id, email, status, joined_at, last_active_at, updated_at)
            VALUES (${uid}, ${email}, 'active', now(), now(), now())
            ON CONFLICT (id) DO NOTHING
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Register API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
