import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Check if accessing admin routes
    if (pathname.startsWith('/admin')) {
      // Redirect to unauthorized if not authenticated
      if (!token) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
      
      // Redirect to unauthorized if not admin
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Check if accessing protected API routes
    if (pathname.startsWith('/api/analytics') || pathname.startsWith('/api/admin')) {
      // Return 401 if no token
      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Return 403 if not admin
      if (token.role !== 'admin') {
        return new NextResponse(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Always allow non-protected routes
        if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/analytics') && !pathname.startsWith('/api/admin')) {
          return true;
        }
        
        // For protected routes, check if user is authenticated
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/analytics/:path*',
    '/api/admin/:path*'
  ]
}; 