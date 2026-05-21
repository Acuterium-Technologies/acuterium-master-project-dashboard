import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'acuterium-access';

/**
 * App-level access-token gate.
 *
 * Required because Vercel Pro tier's Standard Protection (Vercel Auth)
 * does not cover Production custom domains — only .vercel.app URLs and
 * preview deployments. The sovereign data classification on this
 * dashboard makes a hard custom-domain gate non-negotiable.
 *
 * Behaviour:
 *   - Requests carrying a cookie `acuterium-access` whose value matches
 *     process.env.DASHBOARD_ACCESS_TOKEN are passed through.
 *   - All other requests redirect to /login with the original path
 *     preserved in ?from=.
 *
 * Fail-closed safety:
 *   - If DASHBOARD_ACCESS_TOKEN is not configured, every request returns
 *     503. This is intentional: a missing env var must not silently
 *     allow public access, since this middleware is the sole gate
 *     protecting the sovereign data layer on the custom domain.
 *
 * Carve-outs (paths bypassed by this middleware):
 *   - /login          — the form needs to be reachable to enter the token
 *   - /api/login      — the form's POST handler
 *   - /api/seed       — already gated by its own SEED_SECRET bearer check
 *   - /_next/static/* — Next.js static assets (handled by matcher)
 *   - /_next/image/*  — Next.js image optimisation (handled by matcher)
 *   - /favicon.ico    — handled by matcher
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === '/login' ||
    pathname === '/api/login' ||
    pathname === '/api/seed'
  ) {
    return NextResponse.next();
  }

  const expected = process.env.DASHBOARD_ACCESS_TOKEN;

  if (!expected) {
    return new NextResponse(
      'Server misconfigured: DASHBOARD_ACCESS_TOKEN not set. Gate is fail-closed.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie && cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
