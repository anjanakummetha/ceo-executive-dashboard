import type { TravelSegment } from '@/lib/data';
import {
  fetchAllCalendarEventsAround,
  listOutlookCalendars,
} from './calendar-service';
import { shouldIncludeTravelFamilyEvent } from './map-event';
import { mapOutlookEventToTravelSegment } from './map-travel';
import type { OutlookCalendar } from './types';

function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

function daysPast(): number {
  const n = Number(process.env.OUTLOOK_TRAVEL_DAYS_PAST ?? 7);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 30) : 7;
}

function daysAhead(): number {
  const n = Number(process.env.OUTLOOK_TRAVEL_DAYS_AHEAD ?? 90);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 180) : 90;
}

export interface TravelFamilySyncResult {
  segments: TravelSegment[];
  calendars: OutlookCalendar[];
  syncedAt: string;
  range: { daysPast: number; daysAhead: number };
}

export async function fetchTravelFamilyEvents(): Promise<TravelFamilySyncResult> {
  const past = daysPast();
  const ahead = daysAhead();

  if (shouldUseMockData()) {
    const { travelSegments } = await import('@/lib/data');
    return {
      segments: travelSegments,
      calendars: [],
      syncedAt: new Date().toISOString(),
      range: { daysPast: past, daysAhead: ahead },
    };
  }

  const [calendars, events] = await Promise.all([
    listOutlookCalendars(),
    fetchAllCalendarEventsAround(past, ahead),
  ]);

  const segments = events
    .filter(shouldIncludeTravelFamilyEvent)
    .map(mapOutlookEventToTravelSegment)
    .sort((a, b) => {
      const da = a.sortDate ?? a.date;
      const db = b.sortDate ?? b.date;
      if (da !== db) return da.localeCompare(db);
      return a.time.localeCompare(b.time);
    });

  return {
    segments,
    calendars,
    syncedAt: new Date().toISOString(),
    range: { daysPast: past, daysAhead: ahead },
  };
}
