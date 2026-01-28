import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow login page, API routes, and mobile API
    if (pathname === '/login' || pathname.startsWith('/api/') || pathname.startsWith('/mobile-api/')) {
        return NextResponse.next();
    }

    // Check if user is logged in
    const isLoggedIn = request.cookies.get('admin_logged_in')?.value === 'true';

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
