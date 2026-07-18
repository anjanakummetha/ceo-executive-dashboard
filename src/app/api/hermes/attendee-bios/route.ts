import { NextResponse } from 'next/server';
import { readAiCache } from '@/lib/ai/cache-store';
import { generateAttendeeIntel } from '@/lib/ai/generate';
import type { AttendeeIntelBundle } from '@/lib/ai/types';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const refresh = new URL(request.url).searchParams.get('refresh') === '1';
    if (refresh) {
      const { unlinkSync } = await import('fs');
      const { join } = await import('path');
      const { todayMtDateString } = await import('@/lib/outlook/time');
      const day = todayMtDateString();
      try {
        unlinkSync(join(process.cwd(), 'data', 'ai-cache', `${day}-attendee-intel-all.json`));
        unlinkSync(join(process.cwd(), 'data', 'ai-cache', `${day}-attendee-bios-all.json`));
      } catch {
        /* cache miss */
      }
    } else {
      const cached = readAiCache<AttendeeIntelBundle>('attendee-intel', 'all');
      if (cached?.people?.length) {
        return NextResponse.json({ ...cached, source: 'cache' });
      }
    }

    const snapshot = await loadTodaySnapshot();
    const bundle = await generateAttendeeIntel(snapshot);
    return NextResponse.json(bundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Attendee intel failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
