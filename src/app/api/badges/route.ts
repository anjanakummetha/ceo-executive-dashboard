import { NextResponse } from 'next/server';
import { cacheThrough, CACHE_TTL } from '@/lib/cache/ttl-cache';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const badges = await cacheThrough('badges:counts', CACHE_TTL.badges, async () => {
      const s = await loadTodaySnapshot();
      return {
        inbox: s.emails.filter((e) => e.unread).length + s.linkedInUnread,
        meetings: s.meetingCount,
        tasks: s.tasks.filter((t) => t.status === 'overdue').length,
        travel: 0,
      };
    });
    return NextResponse.json(badges);
  } catch {
    return NextResponse.json({ inbox: 0, meetings: 0, tasks: 0, travel: 0 });
  }
}
