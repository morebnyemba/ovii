import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * A lightweight, dependency-free function to decode the payload of a JWT.
 * This is safe to use in Edge environments like Next.js Middleware.
 * @param token The JWT token string.
 * @returns The decoded payload object, or null if decoding fails.
 */
function decodeJwtPayload(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null; // Invalid token format
  }
}
export function middleware(request: NextRequest) {
  // Retrieve the access token from the browser's cookies
  const accessToken = request.cookies.get('access_token')?.value;

  // Define the paths that are considered public (don't require authentication)
  // We remove /set-pin from public paths as it should only be accessed by authenticated users.
  const publicPaths = ['/', '/register', '/login', '/verify-otp'];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  // If the user is trying to access a protected route without a token,
  // redirect them to the login page.
  if (!accessToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user is authenticated:
  if (accessToken) {
    // Decode the token to check the user's status without an API call
    const decodedToken: { has_set_pin: boolean } | null = decodeJwtPayload(accessToken);

    // If the token is malformed or decoding fails, treat as unauthenticated.
    if (!decodedToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If the user has not set their PIN, force them to the /set-pin page.
    // Allow them to access the /set-pin page itself and the API routes.
    if (!decodedToken.has_set_pin && request.nextUrl.pathname !== '/set-pin') {
      // This check prevents a redirect loop if they are already on the set-pin page.
      return NextResponse.redirect(new URL('/set-pin', request.url));
    }

    // If the user HAS set their PIN and tries to access the set-pin page, redirect to dashboard.
    if (decodedToken.has_set_pin && request.nextUrl.pathname === '/set-pin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // and tries to access the root landing page, redirect to dashboard.
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // and tries to access a public auth page (like login), also redirect to dashboard.
    if (publicPaths.includes(request.nextUrl.pathname) && request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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