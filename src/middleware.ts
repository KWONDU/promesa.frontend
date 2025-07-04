// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ONLY_PATH = '/login';
// const PROTECTED_PATHS = ['/me', '/cart'];
const PROTECTED_PATHS = ['/cart'];

function isLoggedIn(req: NextRequest): boolean {
  return Boolean(req.cookies.get('refresh')?.value);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const loggedIn = isLoggedIn(req);

  if (PROTECTED_PATHS.includes(pathname) && !loggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith(PUBLIC_ONLY_PATH) && loggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/me', '/cart'],
};
