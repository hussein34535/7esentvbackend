import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import sql from '@/lib/db';

const DAY_MS = 86400000;

function b64url(value: string): string {
    return Buffer.from(value).toString('base64url');
}

// Admin-only test token: generates a valid stream token for dashboard testing
// without requiring Firebase auth. Uses a fixed test identity that is always
// considered subscribed. The token is valid for 24h (until UTC midnight) like
// normal tickets, but the dashboard fetches a fresh one on every play click.
export async function POST(request: NextRequest) {
    try {
        const tokenSecret = process.env.STREAM_TOKEN_SECRET;
        if (!tokenSecret) {
            return NextResponse.json({ success: false, error: 'TOKEN_SYSTEM_DISABLED' }, { status: 500 });
        }

        const body = await request.json().catch(() => ({}));
        const { channelKey: rawKey, type, id } = body;

        // Accept either channelKey directly or type+id
        let channelKey = rawKey as string | undefined;
        if (!channelKey && type && id) {
            channelKey = `${type}:${id}`;
        }
        if (!channelKey) {
            return NextResponse.json({ success: false, error: 'Missing channelKey or type/id' }, { status: 400 });
        }

        // Fixed dashboard test identity — always valid, never banned, never expires subscription
        const uid = 'admin-dashboard-test';
        const deviceId = 'dashboard-test-device';

        const issuedDay = Math.floor(Date.now() / DAY_MS);
        const hmacHex = crypto.createHmac('sha256', tokenSecret).update(`${uid}.${deviceId}.${issuedDay}`).digest('hex');
        const token = `${b64url(uid)}.${b64url(deviceId)}.${issuedDay}.${hmacHex}`;

        const esenkoBase = process.env.NEXT_PUBLIC_ESENLINKS_URL || 'https://7esenlink.vercel.app';
        const today = issuedDay;
        const hoursRemaining = Math.max(0, ((today + 1) * DAY_MS - Date.now()) / 3600000);

        // Reuse or create session for this test token (same logic as stream-ticket)
        const [tokenRow] = await sql`SELECT active_session_id FROM stream_tokens WHERE token = ${token} AND issued_day = ${today} AND revoked = false`;
        if (tokenRow?.active_session_id) {
            const [live] = await sql`SELECT session_id FROM stream_sessions WHERE session_id = ${tokenRow.active_session_id} AND killed = false`;
            if (live) {
                await sql`UPDATE stream_sessions SET last_heartbeat = now() WHERE session_id = ${live.session_id}`;
                await sql`UPDATE stream_tokens SET last_seen_at = now() WHERE token = ${token}`;
                return NextResponse.json({
                    success: true,
                    token,
                    sessionId: live.session_id,
                    channelKey,
                    esenkoBase,
                    expiresInHours: Math.round(hoursRemaining * 10) / 10,
                    reusable: true,
                });
            }
        }

        const sessionId = crypto.randomUUID();
        await sql.begin(async (tx: any) => {
            await tx`UPDATE stream_sessions SET killed = true, killed_reason = 'SAME_CHANNEL_NEW_DEVICE' WHERE uid = ${uid} AND token != ${token} AND channel_key = ${channelKey} AND killed = false`;
            await tx`INSERT INTO stream_sessions (session_id, token, uid, device_id, channel_key, last_heartbeat) VALUES (${sessionId}, ${token}, ${uid}, ${deviceId}, ${channelKey}, now())`;
            await tx`INSERT INTO stream_tokens (token, uid, device_id, issued_day, active_session_id, last_seen_at) VALUES (${token}, ${uid}, ${deviceId}, ${issuedDay}, ${sessionId}, now()) ON CONFLICT (token) DO UPDATE SET uid = EXCLUDED.uid, device_id = EXCLUDED.device_id, issued_day = EXCLUDED.issued_day, active_session_id = EXCLUDED.active_session_id, last_seen_at = now()`;
        });

        return NextResponse.json({
            success: true,
            token,
            sessionId,
            channelKey,
            esenkoBase,
            expiresInHours: Math.round(hoursRemaining * 10) / 10,
        });
    } catch (error) {
        console.error('Admin stream test token error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
