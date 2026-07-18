import { NextResponse } from 'next/server';
import { syncOutlookCalendars } from '@/lib/outlook/calendar-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') ?? 'today') as 'today' | 'week' | 'month';
  if (!['today', 'week', 'month'].includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }

  try {
    const result = await syncOutlookCalendars(range);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync Outlook';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
