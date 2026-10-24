import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET() { return NextResponse.json({ available: false, error: 'This service is not available.' }, { status: 501 }); }
export async function POST() { return GET(); }
