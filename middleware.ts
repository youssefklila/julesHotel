import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const publicPaths = [
  '/api/auth',
  '/api/verify-access-code',
  '/super-admin/login',
  '/admin/login',
  '/_next',
  '/favicon.ico'
];

// Define protected paths that require authentication
const adminProtectedPaths = [
  '/admin/dashboard',
  '/admin/voting-sessions',
];

const superAdminProtectedPaths = [
  '/super-admin/dashboard',
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths and API routes
  if (publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith(`${path}/`) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/')
  )) {
    return NextResponse.next();
  }
  
  // Check if the path is protected for admin
  if (adminProtectedPaths.some(path => pathname.startsWith(path))) {
    const authCookie = request.cookies.get('adminAuth');
    
    if (!authCookie || authCookie.value !== 'true') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
  
  // Check if the path is protected for super admin
  if (superAdminProtectedPaths.some(path => pathname.startsWith(path))) {
    const superAdminAuth = request.cookies.get('superAdminAuth')?.value === 'true';
    const adminAuth = request.cookies.get('adminAuth')?.value === 'true';
    const adminRole = request.cookies.get('adminRole')?.value;
    
    // Allow access if either superAdminAuth is true or if adminRole is 'superadmin'
    if (!superAdminAuth && !(adminAuth && adminRole === 'superadmin')) {
      const loginUrl = new URL('/super-admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};