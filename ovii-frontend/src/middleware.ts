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
  const publicPaths = ['/', '/register', '/login', '/verify-otp', '/become-a-merchant', '/become-an-agent'];
  // Define auth-specific paths that a logged-in user should be redirected away from.
  const authPaths = ['/login', '/register', '/verify-otp'];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

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

    // The logic to force users to the /set-pin page has been removed as per the new flow.
    // Users will now be directed to set their PIN only when they attempt an action
    // that requires it (e.g., sending money). This allows users who have not set a
    // PIN to access their dashboard and other parts of the application freely.


    // If the user HAS set their PIN and tries to access the set-pin page, redirect to dashboard.
    if (decodedToken.has_set_pin && request.nextUrl.pathname === '/set-pin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // and tries to access the root landing page, redirect to dashboard.
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // and tries to access an auth-specific page (like login), also redirect to dashboard.
    if (authPaths.includes(request.nextUrl.pathname)) {
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