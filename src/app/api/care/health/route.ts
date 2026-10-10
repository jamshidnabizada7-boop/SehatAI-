import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'sehatai-care-staging',
    timestamp: new Date().toISOString(),
  });
}
