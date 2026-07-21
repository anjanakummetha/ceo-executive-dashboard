import { NextResponse } from 'next/server';
import { getPlanningData } from '@/lib/planning/service';

export const dynamic = 'force-dynamic';

/** Week-ahead density, family/personal dates, and the reservation checklist —
 * all derived from one cached 30-day calendar read (read-only). */
export async function GET() {
  try {
    const data = await getPlanningData();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Planning data unavailable';
    return NextResponse.json({ ok: false, error: message, weekAhead: [], family: [], reservations: [] });
  }
}
