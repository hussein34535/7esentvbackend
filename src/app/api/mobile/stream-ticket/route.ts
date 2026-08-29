import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import sql from '@/lib/db';
import { auth } from '@/lib/firebase-admin';

// Stream ticket minting endpoint.
//
// The Flutter app calls this with a Firebase ID token + the device it is
// playing on. On success it receives a 24h stream token bound to
// (uid, deviceId) plus a single active sessionId. The app then builds the
// stream URL as:
//
//   <esenkoBase>/api/stream/<category>/<id>?tk=<token>&sid=<sessionId>&dv=<deviceId>
//
// 7esenlink validates the token (HMAC + day window) and the session freshness
// via the internal /api/internal/session-check endpoint on this backend.

const DAY_MS = 86400000;

function b64url(value: string): string {
    return Buffer.from(value).toString('base64url');
}

export async function POST(request: NextRequest) {
    try {
        // 1. Auth: Firebase ID token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid Authorization header' },
                { status: 401 }
            );
        }
        const idToken = authHeader.replace('Bearer ', '');

        let uid: string;
        try {
            const decoded = await auth.verifyIdToken(idToken);
            uid = decoded.uid;
        } catch (error) {
            console.error('Firebase token verification error:', error);
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid token' },
                { status: 401 }
            );
        }

        // 2. Body
        const body = await request.json();
        const { deviceId, type, id } = body;
        if (!deviceId || !type || !id) {
            return NextResponse.json(
                { success: false, error: 'Missing deviceId, type or id in request body' },
                { status: 400 }
            );
        }
        if (type !== 'channel' && type !== 'match') {
            // Ticketed content types today: channels and matches, both played
            // through 7esenlink stream URLs. Goals/highlights use direct video
            // URLs and are never ticketed.
            return NextResponse.json(
                { success: false, error: 'Unsupported type' },
                { status: 400 }
            );
        }
        // Content identity used for the same-channel takeover rule.
        const channelKey = `${type}:${id}`;

        // 3. Load user row
        const [user] = await sql`SELECT * FROM users WHERE id = ${uid}`;
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // 4. Ban check
        if (user.banned) {
            return NextResponse.json(
                { success: false, error: 'ACCOUNT_BANNED', reason: user.ban_reason || null },
                { status: 403 }
            );
        }

        // 5. Device registry — informational only. Multiple accounts on one
        //    device are allowed; blocking happens at registration time
        //    (register route). Existing accounts are never banned here.
        const [device] = await sql`SELECT uids FROM devices WHERE device_id = ${deviceId}`;
        const existingUids: string[] = device?.uids && Array.isArray(device.uids) ? device.uids : [];
        const allUids = existingUids.includes(uid) ? existingUids : [...existingUids, uid];

        await sql`
            INSERT INTO devices (device_id, account_count, uids, updated_at)
            VALUES (${deviceId}, ${allUids.length}, ${JSON.stringify(allUids)}::jsonb, now())
            ON CONFLICT (device_id) DO UPDATE SET
                account_count = EXCLUDED.account_count,
                uids = EXCLUDED.uids,
                updated_at = now()
        `;

        // 6. Subscription check (same logic as the premium route)
        const subEnd = user.subscription_end ? new Date(user.subscription_end).getTime() : 0;
        if (subEnd <= Date.now()) {
            return NextResponse.json(
                { success: false, error: 'SUBSCRIPTION_REQUIRED' },
                { status: 403 }
            );
        }

        // 7. Token mint: <uid-b64>.<deviceId-b64>.<issuedDay>.<hmac-sha256-hex>
        const tokenSecret = process.env.STREAM_TOKEN_SECRET;
        if (!tokenSecret) {
            return NextResponse.json(
                { success: false, error: 'TOKEN_SYSTEM_DISABLED' },
                { status: 500 }
            );
        }
        const issuedDay = Math.floor(Date.now() / DAY_MS);
        const hmacHex = crypto
            .createHmac('sha256', tokenSecret)
            .update(`${uid}.${deviceId}.${issuedDay}`)
            .digest('hex');
        const token = `${b64url(uid)}.${b64url(deviceId)}.${issuedDay}.${hmacHex}`;

        // 8. Session handling — multi-device friendly. Concurrent streams on
        //    the same account (different devices, different channels) are
        //    ALLOWED. Same device re-requesting a ticket the same day gets
        //    its SAME live sessionId back instead of a new session.
        const today = Math.floor(Date.now() / DAY_MS);
        const hoursRemaining = Math.max(0, ((today + 1) * DAY_MS - Date.now()) / 3600000);
        const esenkoBase = process.env.NEXT_PUBLIC_ESENLINKS_URL || 'https://7esenlink.vercel.app';

        // Reuse path: token minted today and not revoked → if its active
        // session is still live, return the same sessionId (heartbeat refresh).
        const [tokenRow] = await sql`
            SELECT active_session_id FROM stream_tokens
            WHERE token = ${token} AND issued_day = ${today} AND revoked = false
        `;
        if (tokenRow?.active_session_id) {
            const [live] = await sql`
                SELECT session_id FROM stream_sessions
                WHERE session_id = ${tokenRow.active_session_id} AND killed = false
            `;
            if (live) {
                await sql`
                    UPDATE stream_sessions SET last_heartbeat = now()
                    WHERE session_id = ${live.session_id}
                `;
                await sql`
                    UPDATE stream_tokens SET last_seen_at = now() WHERE token = ${token}
                `;
                return NextResponse.json({
                    success: true,
                    sessionId: live.session_id,
                    token,
                    expiresInHours: Math.round(hoursRemaining * 10) / 10,
                    esenkoBase,
                });
            }
        }

        // No live session for this token yet → register a fresh one.
        // Same-channel takeover: one account may watch a given channel on a
        // single device at a time. Creating a session for a channel kills any
        // live session of the SAME channel held by another token (another
        // device) of the same account. Other channels stay untouched.
        const sessionId = crypto.randomUUID();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sql.begin(async (tx: any) => {
            await tx`
                UPDATE stream_sessions
                SET killed = true, killed_reason = 'SAME_CHANNEL_NEW_DEVICE'
                WHERE uid = ${uid} AND token != ${token}
                  AND channel_key = ${channelKey} AND killed = false
            `;
            await tx`
                INSERT INTO stream_sessions (session_id, token, uid, device_id, channel_key, last_heartbeat)
                VALUES (${sessionId}, ${token}, ${uid}, ${deviceId}, ${channelKey}, now())
            `;
            await tx`
                INSERT INTO stream_tokens (token, uid, device_id, issued_day, active_session_id, last_seen_at)
                VALUES (${token}, ${uid}, ${deviceId}, ${issuedDay}, ${sessionId}, now())
                ON CONFLICT (token) DO UPDATE SET
                    uid = EXCLUDED.uid,
                    device_id = EXCLUDED.device_id,
                    issued_day = EXCLUDED.issued_day,
                    active_session_id = EXCLUDED.active_session_id,
                    last_seen_at = now()
            `;
        });

        // 9. Response — the app builds the final stream URL itself.
        return NextResponse.json({
            success: true,
            sessionId,
            token,
            expiresInHours: Math.round(hoursRemaining * 10) / 10,
            esenkoBase,
        });
    } catch (error) {
        console.error('Stream ticket error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
