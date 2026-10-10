import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const stagingSecret = process.env.STAGING_ACCESS_SECRET;
  if (!stagingSecret) {
    return NextResponse.json(
      { error: 'STAGING_AUTH_NOT_CONFIGURED', message: 'Staging authentication secret is not configured on this server.' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const key = body.stagingKey || body.key;
    if (!key || key !== stagingSecret) {
      return NextResponse.json(
        { error: 'INVALID_STAGING_KEY', message: 'The provided staging access key is invalid.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      status: 'ok',
      authenticated: true,
      message: 'Tester session unlocked. Staging access cookie established.',
    });

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    response.cookies.set('sehatai_staging_key', stagingSecret, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7, // 7 days session
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Invalid JSON payload. Provide {"stagingKey": "..."}' },
      { status: 400 }
    );
  }
}
