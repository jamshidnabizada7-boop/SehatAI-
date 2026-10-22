import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    authenticated: true,
    message: 'Public production access active. Unlock not required.',
  });
}
