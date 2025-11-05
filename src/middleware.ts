import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const authToken = req.cookies.get('auth_token');
  const isLoginPage = req.nextUrl.pathname === '/signin';
  const isPrivacyPolicyPage = req.nextUrl.pathname === '/privacy_policy';

  // Allow privacy_policy page to be accessed without login
  if (isPrivacyPolicyPage) {
    return NextResponse.next();
  }

  // Note: sessionStorage check is done client-side in CategoryIdGuard component
  // Middleware only checks for auth_token cookie
  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // if (authToken && isLoginPage) {
  //   return NextResponse.redirect(new URL('/', req.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)'
  ]
};
