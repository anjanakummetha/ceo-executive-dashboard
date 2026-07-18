import { NextResponse } from 'next/server';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    const snapshot = await loadTodaySnapshot(force);
    return NextResponse.json(snapshot, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
