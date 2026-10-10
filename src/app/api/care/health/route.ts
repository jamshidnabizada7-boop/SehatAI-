import { NextResponse } from 'next/server';
import { db, activeDbConfig } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  let dbStatus = 'connected';
  let dbError: string | undefined;
  try {
    await db.$queryRawUnsafe('SELECT 1');
  } catch (e: any) {
    dbStatus = 'disconnected';
    dbError = (e as Error).message;
  }

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'sehatai-care-staging',
    database: {
      status: dbStatus,
      host: activeDbConfig.host,
      database: activeDbConfig.database,
      source: activeDbConfig.sourceFile,
      isStaging: activeDbConfig.isStaging,
      ...(dbError ? { error: dbError } : {}),
    },
    timestamp: new Date().toISOString(),
  }, { status: isHealthy ? 200 : 503 });
}
