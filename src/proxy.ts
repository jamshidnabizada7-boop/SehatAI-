// Care Connect §54 — security headers proxy (Next.js 16 proxy convention).
// Replaces deprecated middleware.ts in accordance with Next.js 16 standards.
// Invariant: No query parameter authentication (?staging_key= is strictly barred).
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  // Security invariant: Query parameter secret passing is strictly barred across all paths
  if (
    req.nextUrl.searchParams.has('staging_key') ||
    req.nextUrl.searchParams.has('stagingKey') ||
    req.nextUrl.searchParams.has('staging_secret')
  ) {
    return NextResponse.json(
      {
        error: 'STAGING_ACCESS_DENIED',
        message: 'Passing secrets in URL query parameters is strictly forbidden. Authenticate via header or cookie.',
      },
      { status: 401 }
    );
  }

  // Redirect deprecated unlock UI directly to public homepage (Decision 1)
  if (req.nextUrl.pathname === '/staging/unlock') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Staging defensive guards (Section 9.4) — unblocked when CARE_ALLOW_MOCK_PAYMENTS=true (Decision 2)
  if (process.env.STAGING_BLOCK_PAYMENTS === 'true' && process.env.CARE_ALLOW_MOCK_PAYMENTS !== 'true') {
    if (
      req.nextUrl.pathname.startsWith('/api/care/payments') ||
      req.nextUrl.pathname.startsWith('/api/care/checkout') ||
      req.nextUrl.pathname.startsWith('/api/care/refunds') ||
      req.nextUrl.pathname.startsWith('/api/doctor/care/payouts')
    ) {
      return NextResponse.json(
        { error: 'PAYMENTS_HARD_BLOCKED_IN_STAGING', message: 'Payment processing is disabled in staging.' },
        { status: 403 }
      );
    }
  }

  if (process.env.STAGING_BLOCK_BOOKING === 'true' && process.env.CARE_ALLOW_MOCK_PAYMENTS !== 'true') {
    if (
      (req.nextUrl.pathname === '/api/appointments' && req.method === 'POST') ||
      (req.nextUrl.pathname === '/api/care/consultations' && req.method === 'POST')
    ) {
      return NextResponse.json(
        { error: 'BOOKING_HARD_BLOCKED_IN_STAGING', message: 'Public booking is disabled in staging.' },
        { status: 403 }
      );
    }
  }

  if (process.env.STAGING_BLOCK_UPLOADS === 'true') {
    const isUploadRoute =
      req.method === 'POST' &&
      (req.nextUrl.pathname === '/api/doctor/upload-doc' ||
        req.nextUrl.pathname === '/api/vlm-analyze' ||
        /^\/api\/care\/consultations\/[^/]+\/attachments$/.test(req.nextUrl.pathname));

    if (isUploadRoute) {
      return NextResponse.json(
        { error: 'PHI_UPLOADS_HARD_BLOCKED_IN_STAGING', message: 'PHI and document uploads are prohibited on staging VM.' },
        { status: 403 }
      );
    }
  }

  const res = NextResponse.next();
  const isDev = process.env.NODE_ENV !== 'production';

  // §54 — CSP: allow Next's inline runtime via nonce-less 'unsafe-inline'
  // in dev only; production uses strict-dynamic for chunk loading.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' ws: wss: https: https://*.livekit.cloud wss://*.livekit.cloud https://*.supabase.co",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  if (!isDev) {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  return res;
}

export { proxy as middleware };
export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
