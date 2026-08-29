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
        const { uid, email, deviceId } = body;

        if (!uid || !email) {
            return NextResponse.json({ error: 'UID and Email are required' }, { status: 400 });
        }

        if (uid !== verifiedUid) {
            return NextResponse.json({ error: 'Forbidden: uid mismatch' }, { status: 403 });
        }

        // Device registry rule: a device that already has an account cannot
        // register another one. Existing accounts are never banned here — the
        // new registration is simply rejected. Web users may omit deviceId.
        if (deviceId) {
            const [device] = await sql`SELECT uids FROM devices WHERE device_id = ${deviceId}`;
            const deviceUids: string[] =
                device?.uids && Array.isArray(device.uids) ? device.uids : [];
            if (deviceUids.length > 0) {
                return NextResponse.json({ error: 'DEVICE_LIMIT_REACHED' }, { status: 403 });
            }
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
