import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import sql from '@/lib/db';

// Internal session validation endpoint.
//
// Called ONLY by the 7esenlink stream validator on every stream URL request:
//   GET /api/internal/session-check?tk=<token>&sid=<sessionId>&dv=<deviceId>
//   Header: x-internal-secret: <INTERNAL_SESSION_SECRET>
//
// Each call acts as a heartbeat for the session (last_heartbeat = now).
// There is NO timeout kill: sessions stay alive until UTC midnight token
// rotation (or manual revocation). If the request carries a `dv` (deviceId)
// that differs from the session's device, validation fails without killing
// the session.

const DAY_MS = 86400000;

export async function GET(request: NextRequest) {
    // The endpoint stays closed (404) unless the internal secret is configured.
    const internalSecret = process.env.INTERNAL_SESSION_SECRET;
    if (!internalSecret) {
        return new NextResponse('Not Found', { status: 404 });
    }

    const provided = request.headers.get('x-internal-secret') || '';
    const providedBuf = Buffer.from(provided);
    const secretBuf = Buffer.from(internalSecret);
    const secretOk =
        providedBuf.length === secretBuf.length && crypto.timingSafeEqual(providedBuf, secretBuf);
    if (!secretOk) {
        return NextResponse.json(
            { active: false, reason: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    const tk = request.nextUrl.searchParams.get('tk');
    const sid = request.nextUrl.searchParams.get('sid');
    const dv = request.nextUrl.searchParams.get('dv');
    if (!tk || !sid) {
        return NextResponse.json(
            { active: false, reason: 'TOKEN_EXPIRED' },
            { status: 400 }
        );
    }

    try {
        const today = Math.floor(Date.now() / DAY_MS);

        // 1. Token lookup
        const [tokenRow] = await sql`
            SELECT token, uid, device_id, issued_day, revoked, active_session_id
            FROM stream_tokens WHERE token = ${tk}
        `;
        if (!tokenRow || tokenRow.revoked || Number(tokenRow.issued_day) !== today) {
            return NextResponse.json({ active: false, reason: 'TOKEN_EXPIRED' });
        }

        // 2. Session lookup
        const [sessionRow] = await sql`
            SELECT session_id, token, device_id, killed, last_heartbeat
            FROM stream_sessions WHERE session_id = ${sid}
        `;
        if (!sessionRow || sessionRow.killed) {
            return NextResponse.json({ active: false, reason: 'SESSION_KILLED' });
        }
        if (sessionRow.token !== tk) {
            return NextResponse.json({ active: false, reason: 'SESSION_MISMATCH' });
        }

        // 3. Device match: the forwarded dv (deviceId) must equal the
        //    session's device. Rejected WITHOUT killing the session.
        if (sessionRow.device_id && dv !== sessionRow.device_id) {
            return NextResponse.json({ active: false, reason: 'SESSION_DEVICE_MISMATCH' });
        }

        await sql`
            UPDATE stream_sessions SET last_heartbeat = now() WHERE session_id = ${sid}
        `;
        await sql`
            UPDATE stream_tokens SET last_seen_at = now() WHERE token = ${tk}
        `;

        return NextResponse.json({ active: true });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { active: false, reason: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
