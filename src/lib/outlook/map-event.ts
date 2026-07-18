import type { Meeting, Attendee } from '@/lib/data';
import type { DashboardCalendarEvent, OutlookEventRaw } from './types';
import { dedupeAttendees } from './meeting-people';

function guessCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (!domain || /^(gmail|yahoo|hotmail|outlook|icloud|me|live)\./i.test(domain)) return '';
  const base = domain.split('.')[0] ?? '';
  return base ? base.charAt(0).toUpperCase() + base.slice(1).replace(/-/g, ' ') : '';
}
import {
  formatDurationMinutes,
  formatTimeMt,
  normalizeOutlookTimeZone,
  parseOutlookDateTimeToUtcIso,
} from './time';

const AVATAR_COLORS = ['#c9a044', '#4a9ed6', '#4caf82', '#e09a44', '#9b59b6', '#e05252'];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function resolveStartEnd(raw: OutlookEventRaw): { start: string; end: string; isAllDay: boolean } {
  const isAllDay = Boolean(raw.isAllDay);
  if (isAllDay) {
    // Graph often sends all-day as dateTime at midnight, not `date`.
    const start =
      raw.start?.date ?? raw.start?.dateTime?.replace(/\.\d+/, '').slice(0, 10) ?? '';
    const end =
      raw.end?.date ?? raw.end?.dateTime?.replace(/\.\d+/, '').slice(0, 10) ?? start;
    return { start, end, isAllDay: true };
  }
  const startTz = normalizeOutlookTimeZone(raw.start?.timeZone);
  const endTz = normalizeOutlookTimeZone(raw.end?.timeZone ?? raw.start?.timeZone);
  const start = parseOutlookDateTimeToUtcIso(raw.start?.dateTime ?? '', startTz);
  const end = parseOutlookDateTimeToUtcIso(raw.end?.dateTime ?? raw.start?.dateTime ?? '', endTz);
  return { start, end, isAllDay: false };
}

function meetingType(
  raw: OutlookEventRaw,
  location: string,
): Meeting['type'] {
  const blob = `${location} ${raw.onlineMeetingUrl ?? ''} ${raw.subject ?? ''}`.toLowerCase();
  if (raw.isOnlineMeeting || /teams|zoom|meet\.google|webex/.test(blob)) return 'video';
  if (/phone|call-in|dial/.test(blob)) return 'phone';
  return 'in-person';
}

export function mapOutlookEvent(
  raw: OutlookEventRaw,
  calendarId: string,
  calendarName: string,
): DashboardCalendarEvent {
  const { start, end, isAllDay } = resolveStartEnd(raw);
  const location = raw.location?.displayName ?? '';
  const attendees =
    raw.attendees
      ?.filter((a) => a.type !== 'resource' && (a.emailAddress?.name || a.emailAddress?.address))
      .map((a) => {
        const name =
          a.emailAddress?.name?.trim() ||
          a.emailAddress?.address?.split('@')[0]?.replace(/[._]/g, ' ') ||
          'Guest';
        return {
          name,
          email: a.emailAddress?.address,
          initials: initials(name),
          color: hashColor(name),
        };
      }) ?? [];

  return {
    id: raw.id,
    title: raw.subject?.trim() || '(No title)',
    startIso: start,
    endIso: end,
    calendarId,
    calendarName,
    location,
    isAllDay,
    isOnline: Boolean(raw.isOnlineMeeting || raw.onlineMeetingUrl),
    onlineMeetingUrl: raw.onlineMeetingUrl,
    webLink: raw.webLink,
    bodyPreview: raw.bodyPreview,
    categories: raw.categories ?? [],
    attendees,
  };
}

export function dedupeEvents(events: DashboardCalendarEvent[]): DashboardCalendarEvent[] {
  const seen = new Map<string, DashboardCalendarEvent>();

  for (const ev of events) {
    const key = ev.title.replace(/\s*\(copy\)\s*$/i, '').trim().toLowerCase() + '|' + ev.startIso.slice(0, 16);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, ev);
      continue;
    }
    // Prefer non-copy calendar name and primary calendar entries
    const evIsCopy = /\(copy\)/i.test(ev.title) || /\(copy\)/i.test(ev.calendarName);
    const existingIsCopy = /\(copy\)/i.test(existing.title) || /\(copy\)/i.test(existing.calendarName);
    if (existingIsCopy && !evIsCopy) seen.set(key, ev);
  }

  return [...seen.values()].sort((a, b) => compareEventStart(a.startIso, b.startIso));
}

function compareEventStart(a: string, b: string): number {
  const ta = eventSortKey(a);
  const tb = eventSortKey(b);
  return ta.localeCompare(tb);
}

function eventSortKey(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return `${iso}T00:00:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? iso : new Date(t).toISOString();
}

const BLOCK_TITLE =
  /\b(wob|inbox review|do not move|focus time|blocked|no scheduling|busy\b|deep work|travel buffer|prep block|lunch block|hold\b|personal block|out of office|^ooo\b)\b/i;

const MEETING_TITLE =
  /\b(meeting|call|sync|standup|stand-up|1:1|1-1|interview|demo|pitch|review|teams|zoom|board|catchup|catch-up|huddle|discussion|workshop|presentation)\b/i;

export type ScheduleKind = 'meeting' | 'other';

/** Split calendar items into real meetings vs blocks, holds, and personal markers. */
export function classifyScheduleKind(ev: DashboardCalendarEvent): ScheduleKind {
  const title = ev.title.trim();
  const attendees = ev.attendees.length;

  if (BLOCK_TITLE.test(title)) return 'other';
  if (ev.isAllDay && attendees === 0) return 'other';
  if (/^\[.+\]$/.test(title) && attendees === 0) return 'other';

  if (attendees >= 2) return 'meeting';
  if (attendees >= 1 && (ev.isOnline || MEETING_TITLE.test(title))) return 'meeting';
  if (ev.isOnline && !BLOCK_TITLE.test(title)) return 'meeting';
  if (MEETING_TITLE.test(title) && attendees >= 1) return 'meeting';
  if (MEETING_TITLE.test(title) && !BLOCK_TITLE.test(title)) return 'meeting';

  return 'other';
}

export function toMeeting(ev: DashboardCalendarEvent): Meeting {
  const attendees: Attendee[] = dedupeAttendees(ev.attendees, true).map((a) => ({
    name: a.name,
    email: a.email,
    role: a.email ? '' : '',
    company: a.email ? guessCompanyFromEmail(a.email) : '',
    initials: a.initials,
    color: a.color,
  }));

  const scheduleKind = classifyScheduleKind(ev);

  return {
    id: ev.id,
    title: ev.title,
    time: formatTimeMt(ev.startIso, ev.isAllDay),
    duration: ev.isAllDay ? 'All day' : formatDurationMinutes(ev.startIso, ev.endIso),
    attendees,
    location: ev.location || ev.calendarName,
    type: meetingType(
      {
        id: ev.id,
        subject: ev.title,
        isOnlineMeeting: ev.isOnline,
        onlineMeetingUrl: ev.onlineMeetingUrl,
      },
      ev.location,
    ),
    scheduleKind,
    startIso: ev.startIso,
    calendarName: ev.calendarName,
    flagged: false,
    notes: ev.categories.length ? `Categories: ${ev.categories.join(', ')}` : undefined,
    agenda: `Calendar: ${ev.calendarName}`,
  };
}

/** Family / travel signals from calendar name, title, or categories */
export function isFamilyOrTravelEvent(ev: DashboardCalendarEvent): boolean {
  const hay = `${ev.calendarName} ${ev.title} ${ev.categories.join(' ')} ${ev.location}`.toLowerCase();
  return /family|travel|trip|vacation|hotel|flight|birthday|anniversary|personal|maclain|landen|kids|dinner|wedding|holiday|airport|getaway|mom|dad|bridget|edee|ski|beach|cruise|reunion|celebration/.test(
    hay,
  );
}

/** Dedicated family/travel/birthday calendars (include every event). */
export function isTravelFamilyCalendar(calendarName: string): boolean {
  const n = calendarName.toLowerCase();
  if (/birthday/.test(n) && !/tasks|workspace/.test(n)) return true;
  if (/family/.test(n) && /travel|birthday|event/.test(n)) return true;
  if (/family\/travel|travel\/family|travel.*family/.test(n)) return true;
  if (/^travel\b|travel events|family events/.test(n)) return true;
  return false;
}

export function isKoryMasterCalendar(calendarName: string): boolean {
  return /kory master calendar.*\(all\)|master calendar \(all\)/i.test(calendarName);
}

export function shouldIncludeTravelFamilyEvent(ev: DashboardCalendarEvent): boolean {
  if (isTravelFamilyCalendar(ev.calendarName)) return true;
  if (/^birthdays$/i.test(ev.calendarName.trim())) return true;
  if (isKoryMasterCalendar(ev.calendarName)) return isFamilyOrTravelEvent(ev);
  if (isFamilyOrTravelEvent(ev)) return true;
  return false;
}
