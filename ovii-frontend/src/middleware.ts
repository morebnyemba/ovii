import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Retrieve the access token from the browser's cookies
  const accessToken = request.cookies.get('access_token')?.value;

  // Define the paths that are considered public (don't require authentication)
  const publicPaths = ['','register','set-pin','/login', '/verify-otp'];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // If the user is trying to access a protected route without a token,
  // redirect them to the login page.
  if (!accessToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated and tries to access a public auth page (like login),
  // redirect them to the dashboard.
  if (accessToken && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If none of the above conditions are met, allow the request to proceed.
  return NextResponse.next();
}

// The "matcher" config specifies which paths the middleware should run on.
// This is more efficient than running it on every single request.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};