import { NextResponse } from 'next/server';
import { listOutlookCalendars } from '@/lib/outlook/calendar-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const calendars = await listOutlookCalendars();
    return NextResponse.json({ calendars, syncedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list calendars';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
