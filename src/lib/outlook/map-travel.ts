import type { TravelSegment } from '@/lib/data';
import type { DashboardCalendarEvent } from './types';
import { formatDateLabelMt, formatTimeMt, mtDateKeyFromIso } from './time';
import { isFamilyOrTravelEvent } from './map-event';

function inferTravelType(
  ev: DashboardCalendarEvent,
): TravelSegment['type'] {
  const hay = `${ev.title} ${ev.location} ${ev.categories.join(' ')}`.toLowerCase();
  if (/flight|airline|airport|depart|arrival|→|->/.test(hay)) return 'flight';
  if (/hotel|check-in|check-out|resort|lodging|airbnb/.test(hay)) return 'hotel';
  if (/uber|lyft|car service|rental car|shuttle|ground transport/.test(hay)) return 'car';
  if (/train|amtrak|rail/.test(hay)) return 'train';
  if (/dinner|lunch|brunch|restaurant|reservation|dining/.test(hay)) return 'restaurant';
  return 'other';
}

function inferEventKind(ev: DashboardCalendarEvent): TravelSegment['eventKind'] {
  const hay = `${ev.calendarName} ${ev.title} ${ev.categories.join(' ')}`.toLowerCase();
  if (/birthday|bday|turns \d+/.test(hay)) return 'birthday';
  if (/family|kids|mom|dad|bridget|edee|anniversary|dinner with/.test(hay)) return 'family';
  if (isFamilyOrTravelEvent(ev) && /travel|trip|flight|hotel|vacation|conference/.test(hay)) {
    return 'travel';
  }
  return 'personal';
}

function eventStatus(ev: DashboardCalendarEvent): TravelSegment['status'] {
  const end = new Date(ev.endIso).getTime();
  const now = Date.now();
  if (end < now) return 'completed';
  return 'confirmed';
}

function sortableDateKey(iso: string): string {
  return mtDateKeyFromIso(iso);
}

export function mapOutlookEventToTravelSegment(ev: DashboardCalendarEvent): TravelSegment {
  const startLabel = formatDateLabelMt(ev.startIso);
  const endLabel = formatDateLabelMt(ev.endIso);
  const multiDay = sortableDateKey(ev.startIso) !== sortableDateKey(ev.endIso);
  const date = multiDay ? `${startLabel} – ${endLabel}` : startLabel;
  const kind = inferEventKind(ev);

  const detailsParts = [
    ev.location && `Location: ${ev.location}`,
    `Calendar: ${ev.calendarName}`,
    ev.categories.length ? `Categories: ${ev.categories.join(', ')}` : null,
    ev.attendees.length
      ? `With: ${ev.attendees.slice(0, 4).map((a) => a.name).join(', ')}${ev.attendees.length > 4 ? '…' : ''}`
      : null,
  ].filter(Boolean);

  return {
    id: ev.id,
    type: inferTravelType(ev),
    title: ev.title,
    date,
    sortDate: sortableDateKey(ev.startIso),
    time: formatTimeMt(ev.startIso, ev.isAllDay),
    endTime: ev.isAllDay ? undefined : formatTimeMt(ev.endIso, false),
    confirmationCode: ev.id.slice(-8).toUpperCase(),
    status: eventStatus(ev),
    details: detailsParts.join(' · ') || 'Outlook calendar event',
    location: ev.location || undefined,
    provider: ev.calendarName,
    notes: ev.bodyPreview?.trim() || undefined,
    flagged: /important|action|deadline|urgent/i.test(
      `${ev.categories.join(' ')} ${ev.title}`,
    ),
    calendarName: ev.calendarName,
    webLink: ev.webLink,
    eventKind: kind,
  };
}
