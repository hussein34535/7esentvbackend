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
//   <esenkoBase>/api/stream/<category>/<id>?tk=<token>&sid=<sessionId>
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
        if (type !== 'channel') {
            // Matches/premium content can be added later; channel is the only
            // content that plays through 7esenlink stream URLs today.
            return NextResponse.json(
                { success: false, error: 'Unsupported type' },
                { status: 400 }
            );
        }

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

        // 5. Device binding: allow at most 1 device change per 7 days
        if (user.active_device_id && user.active_device_id !== deviceId) {
            const changedAt = user.device_changed_at ? new Date(user.device_changed_at).getTime() : 0;
            const withinSevenDays = Date.now() - changedAt < 7 * DAY_MS;
            if (withinSevenDays) {
                return NextResponse.json(
                    { success: false, error: 'DEVICE_MISMATCH' },
                    { status: 403 }
                );
            }
            await sql`
                UPDATE users
                SET active_device_id = ${deviceId}, device_changed_at = now()
                WHERE id = ${uid}
            `;
        } else if (!user.active_device_id) {
            // First time this account binds to a device — record it.
            await sql`
                UPDATE users
                SET active_device_id = ${deviceId}, device_changed_at = now()
                WHERE id = ${uid}
            `;
        }

        // 6. Device registry + multi-account ban
        const [device] = await sql`SELECT account_count, uids FROM devices WHERE device_id = ${deviceId}`;
        const existingUids: string[] = device?.uids && Array.isArray(device.uids) ? device.uids : [];
        const allUids = existingUids.includes(uid) ? existingUids : [...existingUids, uid];

        if (device && allUids.length > 1) {
            // Same device used by a 2nd account → ban every account on it.
            const reason = 'MULTI_ACCOUNTS_SAME_DEVICE';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await sql.begin(async (tx: any) => {
                for (const u of allUids) {
                    await tx`
                        UPDATE users SET banned = true, ban_reason = ${reason} WHERE id = ${u}
                    `;
                }
                await tx`
                    INSERT INTO devices (device_id, account_count, uids, updated_at)
                    VALUES (${deviceId}, ${allUids.length}, ${JSON.stringify(allUids)}::jsonb, now())
                    ON CONFLICT (device_id) DO UPDATE SET
                        account_count = EXCLUDED.account_count,
                        uids = EXCLUDED.uids,
                        updated_at = now()
                `;
            });
            return NextResponse.json(
                { success: false, error: 'MULTI_ACCOUNTS_BANNED' },
                { status: 403 }
            );
        }

        // Record/refresh the device row (single-account case).
        await sql`
            INSERT INTO devices (device_id, account_count, uids, updated_at)
            VALUES (${deviceId}, ${allUids.length}, ${JSON.stringify(allUids)}::jsonb, now())
            ON CONFLICT (device_id) DO UPDATE SET
                account_count = EXCLUDED.account_count,
                uids = EXCLUDED.uids,
                updated_at = now()
        `;

        // 7. Subscription check (same logic as the premium route)
        const subEnd = user.subscription_end ? new Date(user.subscription_end).getTime() : 0;
        if (subEnd <= Date.now()) {
            return NextResponse.json(
                { success: false, error: 'SUBSCRIPTION_REQUIRED' },
                { status: 403 }
            );
        }

        // 8. Token mint: <uid-b64>.<deviceId-b64>.<issuedDay>.<hmac-sha256-hex>
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

        // 9. Single-session: kill any older active session for this token,
        //    then register the new one. All in one transaction.
        const sessionId = crypto.randomUUID();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sql.begin(async (tx: any) => {
            await tx`
                UPDATE stream_sessions
                SET killed = true, killed_reason = 'NEW_LOGIN'
                WHERE token = ${token} AND killed = false
            `;
            await tx`
                UPDATE stream_tokens SET active_session_id = null WHERE token = ${token}
            `;
            await tx`
                INSERT INTO stream_sessions (session_id, token, uid, device_id, last_heartbeat)
                VALUES (${sessionId}, ${token}, ${uid}, ${deviceId}, now())
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

        // 10. Response — the app builds the final stream URL itself.
        const hoursRemaining = Math.max(0, ((Math.floor(Date.now() / DAY_MS) + 1) * DAY_MS - Date.now()) / 3600000);
        const esenkoBase = process.env.NEXT_PUBLIC_ESENLINKS_URL || 'https://7esenlink.vercel.app';

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
