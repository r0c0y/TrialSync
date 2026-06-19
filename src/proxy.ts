import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/auth/demo',
  '/api/auth/github',
  '/api/auth/logout',
  '/_next',
  '/favicon',
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public paths and static assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth cookie (set by login page) or Authorization header
  const sessionCookie = request.cookies.get('trialsync_session');
  const authHeader = request.headers.get('authorization');

  if (!sessionCookie && !authHeader) {
    // Redirect unauthenticated users to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
