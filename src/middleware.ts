import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const authToken = req.cookies.get('auth_token');
  const isLoginPage = req.nextUrl.pathname === '/signin';
  const isPrivacyPolicyPage = req.nextUrl.pathname === '/privacy_policy';

  // Allow privacy_policy page to be accessed without login
  if (isPrivacyPolicyPage) {
    return NextResponse.next();
  }

  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)'
  ]
};
