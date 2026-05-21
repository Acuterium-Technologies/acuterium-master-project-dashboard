import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'acuterium-access';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Login handler. Accepts { token } as JSON body. If token matches
 * process.env.DASHBOARD_ACCESS_TOKEN, sets an HttpOnly+Secure+SameSite=Lax
 * cookie carrying the token, which the middleware then accepts on
 * subsequent requests.
 *
 * Fail-closed: missing env var returns 503, never accepts the request.
 */
export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid-body' },
      { status: 400 }
    );
  }

  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'server-misconfigured' },
      { status: 503 }
    );
  }

  const { token } = body;
  if (!token || typeof token !== 'string' || token !== expected) {
    return NextResponse.json(
      { ok: false, error: 'invalid-token' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/'
  });
  return response;
}
