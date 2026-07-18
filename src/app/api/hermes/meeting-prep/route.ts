import { NextResponse } from 'next/server';
import {
  buildMeetingRelationshipSummary,
  buildMeetingTalkingPoints,
  intelByKey,
} from '@/lib/ai/meeting-local-prep';
import { readAiCache } from '@/lib/ai/cache-store';
import type { AttendeeIntelBundle } from '@/lib/ai/types';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';

export const dynamic = 'force-dynamic';

/** No Hermes call — derived from cached attendee intel. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing meeting id' }, { status: 400 });
  }
  try {
    const snapshot = await loadTodaySnapshot();
    const meeting = snapshot.meetings.find((m) => m.id === id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const bundle =
      readAiCache<AttendeeIntelBundle>('attendee-intel', 'all') ?? { people: [] };
    const byIntel = intelByKey(bundle.people);

    const prep = {
      aiTalkingPoints: buildMeetingTalkingPoints(meeting, byIntel),
      aiRelationshipContext: buildMeetingRelationshipSummary(meeting, byIntel),
      aiRecentNews: '',
    };

    return NextResponse.json({ id, prep, source: 'outlook-email-cache' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Meeting prep failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
