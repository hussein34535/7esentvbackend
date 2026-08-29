import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Admin cookie validation
// Accepts EITHER the legacy literal 'true' (temporary backward compatibility)
// OR the new signed format 'v1.<hex hmac-sha256(username, ADMIN_JWT_SECRET)>'.
// Uses Web Crypto (crypto.subtle) — Node crypto is not available in the Edge
// runtime. If ADMIN_JWT_SECRET / ADMIN_USERNAME are missing, only 'true' is
// accepted (legacy behavior).
// ---------------------------------------------------------------------------
async function computeHmacHex(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function isValidAdminCookie(value: string | undefined): Promise<boolean> {
    if (!value) return false;

    // Legacy cookie (temporary backward compatibility)
    if (value === 'true') return true;

    // Signed cookie: v1.<hex hmac>
    if (!value.startsWith('v1.')) return false;

    const secret = process.env.ADMIN_JWT_SECRET;
    const username = process.env.ADMIN_USERNAME;
    if (!secret || !username) return false;

    const provided = value.slice('v1.'.length);
    const expected = await computeHmacHex(username, secret);

    // Constant-time-ish comparison to avoid leaking the expected value
    if (provided.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
        diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /api/admin/*: valid admin cookie OR x-admin-secret header
    if (pathname.startsWith('/api/admin')) {
        const headerSecret = request.headers.get('x-admin-secret');
        const apiSecret = process.env.ADMIN_API_SECRET;

        if (apiSecret && headerSecret && headerSecret === apiSecret) {
            return NextResponse.next();
        }

        const cookie = request.cookies.get('admin_logged_in')?.value;
        if (await isValidAdminCookie(cookie)) {
            return NextResponse.next();
        }

        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow other API routes, and mobile API (they handle their own auth)
    if (pathname.startsWith('/api/') || pathname.startsWith('/mobile-api/')) {
        return NextResponse.next();
    }

    // Allow login page
    if (pathname === '/login') {
        return NextResponse.next();
    }

    // Check if user is logged in (pages)
    const isLoggedIn = await isValidAdminCookie(request.cookies.get('admin_logged_in')?.value);

    if (!isLoggedIn) {
        // Redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
