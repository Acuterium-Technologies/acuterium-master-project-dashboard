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

  // PWA + brand carve-outs added in v1.4 Phase 1A/1C — these must be
  // reachable before the access cookie is set, otherwise the service
  // worker can't install, the manifest/icons can't be fetched, and
  // browsers can't render the brand mark on the login page itself.
  // Brand assets are non-sensitive by classification (D-08 visual
  // extension); the real data plane remains gated below.
  if (
    pathname === '/login' ||
    pathname === '/api/login' ||
    pathname === '/api/seed' ||
    pathname === '/api/cwh/transition' ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/api/dashboard/') ||
    pathname.startsWith('/api/auditlog/') ||
    // Phase 3d-i · /legal/* + /ar/legal/* are PUBLIC by GDPR Art. 9 (2)(a).
    // The biometric disclosure must be readable by anyone deciding whether
    // to grant consent. Operations route /master-ops/settings/biometrics
    // remains gated by the cookie path below.
    pathname.startsWith('/legal/') ||
    pathname.startsWith('/ar/legal/') ||
    // Phase 3d-i · self-hosted ML models must load same-origin without auth
    // (consent gate happens client-side before fetch is even invoked).
    pathname.startsWith('/models/') ||
    pathname.startsWith('/workers/') ||
    // Vercel Web Analytics + Speed Insights telemetry. These first-party
    // collector paths (script.js + the view/vitals beacons) must never be
    // redirected to /login — otherwise a beacon sent after a cookie expires
    // gets an HTML 307 instead of reaching Vercel. Non-sensitive by nature.
    pathname.startsWith('/_vercel/') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/sovereign-fonts.css' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/og-image.png' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/favicon-') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/brand/')
  ) {
    // /api/cwh/transition carve-out (Phase 2, ADDITIVE): the route
    // performs its own bearer-cookie check internally so it can return
    // structured JSON 401/403/429 instead of a 307 redirect. Other API
    // routes (/api/sheet, etc.) continue to be gated by this middleware.
    // Leak-fix 58b61d1 preserved (existing assertions unchanged).
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
