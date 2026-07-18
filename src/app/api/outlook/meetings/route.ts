import { NextResponse } from 'next/server';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';
import { meetings as mockMeetings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return NextResponse.json({
        meetings: mockMeetings,
        syncedAt: new Date().toISOString(),
        source: 'mock',
      });
    }

    const snapshot = await loadTodaySnapshot();
    return NextResponse.json({
      meetings: snapshot.meetings,
      syncedAt: snapshot.syncedAt,
      source: 'outlook',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load meetings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
