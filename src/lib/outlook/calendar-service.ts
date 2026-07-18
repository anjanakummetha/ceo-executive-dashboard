import { executeComposioTool } from '@/lib/composio/client';
import { dedupeEvents, mapOutlookEvent } from './map-event';
import type { DashboardCalendarEvent, OutlookCalendar, OutlookEventRaw } from './types';
import { mtDateKeyFromIso, mtDayBounds, mtRangeBounds, mtRangeBoundsAround, todayMtDateString } from './time';

function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

function parseList<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.value)) return p.value as T[];
  if (p.data && typeof p.data === 'object') {
    const d = p.data as Record<string, unknown>;
    if (Array.isArray(d.value)) return d.value as T[];
    if (Array.isArray(d.data)) return d.data as T[];
  }
  if (Array.isArray(p.data)) return p.data as T[];
  return [];
}

export async function listOutlookCalendars(): Promise<OutlookCalendar[]> {
  const result = await executeComposioTool<unknown>('OUTLOOK_LIST_CALENDARS', {}, 'outlook');
  return parseList<OutlookCalendar>(result).map((c) => ({
    id: c.id,
    name: c.name,
    isDefaultCalendar: c.isDefaultCalendar,
    canEdit: c.canEdit,
  }));
}

async function fetchCalendarView(
  calendarId: string,
  start: string,
  end: string,
): Promise<OutlookEventRaw[]> {
  const result = await executeComposioTool<unknown>(
    'OUTLOOK_GET_CALENDAR_VIEW',
    {
      calendar_id: calendarId,
      start_datetime: start,
      end_datetime: end,
      timezone: 'America/Denver',
    },
    'outlook',
  );
  return parseList<OutlookEventRaw>(result);
}

/**
 * Reads every calendar in Kory's mailbox and dedupes mirrored "(copy)" events.
 */
export async function fetchAllCalendarEvents(
  range: 'today' | 'week' | 'month' = 'today',
): Promise<DashboardCalendarEvent[]> {
  if (useMockData()) return [];

  const bounds =
    range === 'today'
      ? mtDayBounds()
      : range === 'week'
        ? mtRangeBounds(7)
        : mtRangeBounds(30);

  return fetchAllCalendarEventsBetween(bounds.start, bounds.end);
}

export async function fetchAllCalendarEventsBetween(
  start: string,
  end: string,
): Promise<DashboardCalendarEvent[]> {
  if (useMockData()) return [];

  const calendars = await listOutlookCalendars();
  const all: DashboardCalendarEvent[] = [];

  for (const cal of calendars) {
    try {
      const raw = await fetchCalendarView(cal.id, start, end);
      for (const event of raw) {
        all.push(mapOutlookEvent(event, cal.id, cal.name));
      }
    } catch (e) {
      console.warn(`[outlook] skip calendar "${cal.name}":`, e);
    }
  }

  return dedupeEvents(all);
}

export async function fetchAllCalendarEventsAround(
  daysPast: number,
  daysAhead: number,
): Promise<DashboardCalendarEvent[]> {
  const bounds = mtRangeBoundsAround(daysPast, daysAhead);
  return fetchAllCalendarEventsBetween(bounds.start, bounds.end);
}

export async function fetchTodayMeetingsFromOutlook() {
  const events = await fetchAllCalendarEvents('today');
  const today = todayMtDateString();
  return events.filter((e) => {
    const day = mtDateKeyFromIso(e.startIso);
    if (day === today) return true;
    // Multi-day all-day items that span today
    if (e.isAllDay && /^\d{4}-\d{2}-\d{2}$/.test(e.startIso) && /^\d{4}-\d{2}-\d{2}$/.test(e.endIso)) {
      return e.startIso <= today && e.endIso > today;
    }
    return false;
  });
}

export interface OutlookSyncResult {
  calendars: OutlookCalendar[];
  events: DashboardCalendarEvent[];
  syncedAt: string;
  range: string;
}

export async function syncOutlookCalendars(
  range: 'today' | 'week' | 'month' = 'today',
): Promise<OutlookSyncResult> {
  const [calendars, events] = await Promise.all([
    listOutlookCalendars(),
    fetchAllCalendarEvents(range),
  ]);
  return {
    calendars,
    events,
    syncedAt: new Date().toISOString(),
    range,
  };
}
