import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that should be blocked on production (baselots.com)
const BLOCKED_PROD_ROUTES = [
  '/kyc',
  '/kyc/',
  '/token',
  '/token/',
  '/hsp-demo',
  '/hsp-demo/',
  '/stylus-demo',
  '/stylus-demo/',
  '/contracts',
  '/contracts/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Check if we're on production
  const isProduction = 
    hostname === 'baselots.com' || 
    hostname === 'www.baselots.com';

  // Block demo routes on production
  if (isProduction && BLOCKED_PROD_ROUTES.some(route => pathname.startsWith(route))) {
    console.log(`[Middleware] Blocking ${pathname} on production (${hostname})`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    '/kyc/:path*',
    '/token/:path*',
    '/hsp-demo/:path*',
    '/stylus-demo/:path*',
    '/contracts/:path*',
  ],
};
