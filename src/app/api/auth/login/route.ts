import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Brute-force protection (in-memory)
// NOTE: on Vercel serverless this Map lives per lambda instance and resets on
// cold start / new instance, so it acts as a soft rate limit, not a global one.
// ---------------------------------------------------------------------------
const failedAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return 'unknown';
}

function recordFailedAttempt(ip: string) {
    const now = Date.now();
    const entry = failedAttempts.get(ip);

    if (entry && now - entry.firstAttempt < WINDOW_MS) {
        entry.count += 1;
    } else {
        failedAttempts.set(ip, { count: 1, firstAttempt: now });
    }

    // Light pruning so the map doesn't grow unbounded
    if (failedAttempts.size > 1000) {
        for (const [key, value] of failedAttempts) {
            if (now - value.firstAttempt >= WINDOW_MS) failedAttempts.delete(key);
        }
    }
}

function isRateLimited(ip: string): boolean {
    const entry = failedAttempts.get(ip);
    if (!entry) return false;
    const now = Date.now();
    if (now - entry.firstAttempt >= WINDOW_MS) {
        failedAttempts.delete(ip); // window expired, reset
        return false;
    }
    return entry.count >= MAX_ATTEMPTS;
}

// Signed admin cookie value: v1.<hex hmac-sha256(username, ADMIN_JWT_SECRET)>
function signAdminToken(username: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret).update(username).digest('hex');
    return `v1.${hmac}`;
}

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        // No hardcoded fallback: if env vars are missing, login always fails (401)
        const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
        const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

        if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_JWT_SECRET) {
            console.error('Login misconfigured: ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_JWT_SECRET must be set');
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const ip = getClientIp(request);

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many failed attempts. Try again in 15 minutes.' },
                { status: 429 }
            );
        }

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            failedAttempts.delete(ip); // successful login resets the counter
            const response = NextResponse.json({ success: true });

            // Set HTTP-only cookie with a signed value (validated in middleware)
            response.cookies.set('admin_logged_in', signAdminToken(ADMIN_USERNAME, ADMIN_JWT_SECRET), {
                httpOnly: true,
                secure: true, // site is served over HTTPS (Vercel)
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            return response;
        } else {
            recordFailedAttempt(ip);
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
