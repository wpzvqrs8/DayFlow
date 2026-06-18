import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'dayflow_session';
const JWT_SECRET_STR = process.env.DAYFLOW_JWT_SECRET || 'fallback_default_jwt_secret_must_be_32_chars_long_minimum';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Skip static assets, favicon, and auth API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Validate token from cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  let isAuthenticated = false;

  if (sessionCookie?.value) {
    try {
      await jwtVerify(sessionCookie.value, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      // Invalid/expired token
      isAuthenticated = false;
    }
  }

  // 3. API Protection
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.next();
  }

  // 4. Page Routing Protection
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected pages: /dashboard, /calendar, /analytics, /settings
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Export as default as well
export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
