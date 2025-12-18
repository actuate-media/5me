import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/companies') ||
    req.nextUrl.pathname.startsWith('/feedback') ||
    req.nextUrl.pathname.startsWith('/widgets') ||
    req.nextUrl.pathname.startsWith('/settings');

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all protected routes
    '/dashboard/:path*',
    '/companies/:path*',
    '/feedback/:path*',
    '/widgets/:path*',
    '/settings/:path*',
  ],
};
