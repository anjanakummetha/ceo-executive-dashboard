/**
 * Personal-CEO planning derivations (dashboard F2–F4), all computed from ONE
 * shared 30-day calendar read so the extra Composio cost is a single cached call.
 *   F2 Week-Ahead density + protected/travel days
 *   F3 Family & personal dates (birthdays, kid events, family blocks)
 *   F4 Reservation checklist (coffee/HH/dinner needing a reservation)
 */

import { fetchAllCalendarEvents } from '@/lib/outlook/calendar-service';
import { cacheThrough, CACHE_TTL } from '@/lib/cache/ttl-cache';
import type { DashboardCalendarEvent } from '@/lib/outlook/types';

const MT = 'America/Denver';

function mtDateKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { timeZone: MT }); // YYYY-MM-DD
}
function mtWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: MT, weekday: 'short' });
}
function hoursBetween(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000);
}

// ── F2: week-ahead ──────────────────────────────────────────────────────────
export interface DayDensity {
  date: string;
  weekday: string;
  meetingCount: number;
  meetingHours: number;
  travel: boolean;
  protected: boolean;
  backToBackWarning: boolean;
}

const TRAVEL_RE = /\bkory in\b|\bflight to\b|\bin (nyc|ny|la|sf|denver|napa|ca|wy)\b|out of office|\booo\b/i;
const PROTECTED_RE = /do not move|drop\s*off|pick\s*up|personal training|\btrainer\b|\bwob\b|\bypo\b|board meeting|\bdoug\b/i;

export function buildWeekAhead(events: DashboardCalendarEvent[]): DayDensity[] {
  const today = new Date();
  const days: DayDensity[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = d.toLocaleDateString('en-CA', { timeZone: MT });
    const weekday = d.toLocaleDateString('en-US', { timeZone: MT, weekday: 'short' });
    const onDay = events.filter((e) => mtDateKey(e.startIso) === key);
    const meetings = onDay.filter((e) => !e.isAllDay);
    const meetingHours = meetings.reduce((s, e) => s + hoursBetween(e.startIso, e.endIso), 0);
    // Back-to-back: 3+ meetings whose gaps are < 15 min.
    const sorted = [...meetings].sort((a, b) => a.startIso.localeCompare(b.startIso));
    let streak = 1;
    let maxStreak = meetings.length ? 1 : 0;
    for (let j = 1; j < sorted.length; j++) {
      const gap = (new Date(sorted[j].startIso).getTime() - new Date(sorted[j - 1].endIso).getTime()) / 60_000;
      streak = gap <= 15 ? streak + 1 : 1;
      maxStreak = Math.max(maxStreak, streak);
    }
    days.push({
      date: key,
      weekday,
      meetingCount: meetings.length,
      meetingHours: Math.round(meetingHours * 10) / 10,
      travel: onDay.some((e) => TRAVEL_RE.test(e.title)),
      protected: onDay.some((e) => PROTECTED_RE.test(e.title)),
      backToBackWarning: maxStreak >= 3,
    });
  }
  return days;
}

// ── F3: family & personal dates ─────────────────────────────────────────────
export interface FamilyDate {
  date: string;
  weekday: string;
  title: string;
  kind: 'birthday' | 'kid' | 'family' | 'do-not-move';
}

const BIRTHDAY_RE = /birthday|\bbday\b|🎂/i;
const KID_RE = /maclain|\bcamp\b|pickup|pick\s*up|drop\s*off|\bschool\b|lego|magic camp|coding|explorers/i;
const FAMILY_RE = /\bbridget\b|\bfamily\b|\banniversary\b|horse (show|clinic)|\bb @ | family calendar/i;
const DNM_RE = /do not move/i;

export function buildFamilyDates(events: DashboardCalendarEvent[]): FamilyDate[] {
  const out: FamilyDate[] = [];
  for (const e of events) {
    const t = e.title || '';
    let kind: FamilyDate['kind'] | null = null;
    if (DNM_RE.test(t)) kind = 'do-not-move';
    else if (BIRTHDAY_RE.test(t)) kind = 'birthday';
    else if (KID_RE.test(t)) kind = 'kid';
    else if (FAMILY_RE.test(t)) kind = 'family';
    if (!kind) continue;
    out.push({ date: mtDateKey(e.startIso), weekday: mtWeekday(e.startIso), title: t, kind });
  }
  // De-dup by (date,title); sort ascending.
  const seen = new Set<string>();
  return out
    .filter((d) => {
      const k = `${d.date}|${d.title.toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 20);
}

// ── F4: reservation checklist ───────────────────────────────────────────────
export interface ReservationItem {
  id: string;
  date: string;
  weekday: string;
  title: string;
  type: 'coffee' | 'happy-hour' | 'dinner';
  location: string;
  needsReservation: boolean;
  reason: string;
}

const RESERVATION_VENUES = /cherry creek grill|hillstone|quality italian|toro|801 chophouse|beckon|avra/i;

function mealType(title: string): ReservationItem['type'] | null {
  const t = title.toLowerCase();
  if (/\bcoffee\b|\bcafe\b|aviano|olive & finch/.test(t)) return 'coffee';
  if (/happy hour|\bdrinks\b|cocktail/.test(t)) return 'happy-hour';
  if (/\bdinner\b|\bsupper\b/.test(t)) return 'dinner';
  return null;
}

export function buildReservations(events: DashboardCalendarEvent[]): ReservationItem[] {
  const cutoff = Date.now() + 14 * 86_400_000;
  const out: ReservationItem[] = [];
  for (const e of events) {
    if (e.isAllDay) continue;
    if (new Date(e.startIso).getTime() > cutoff) continue;
    const type = mealType(e.title);
    if (!type) continue;
    const loc = e.location || '';
    // Happy hour & dinner always want a reservation; coffee only at known venues.
    const wantsRes = type !== 'coffee' || RESERVATION_VENUES.test(loc) || RESERVATION_VENUES.test(e.title);
    const noVenue = !loc.trim();
    out.push({
      id: e.id,
      date: mtDateKey(e.startIso),
      weekday: mtWeekday(e.startIso),
      title: e.title,
      type,
      location: loc,
      needsReservation: wantsRes && (noVenue || RESERVATION_VENUES.test(loc)),
      reason: noVenue ? 'No venue set' : RESERVATION_VENUES.test(loc) ? 'Reservation-required venue' : 'Confirm reservation',
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Shared fetch ────────────────────────────────────────────────────────────
export interface PlanningData {
  weekAhead: DayDensity[];
  family: FamilyDate[];
  reservations: ReservationItem[];
}

export async function getPlanningData(): Promise<PlanningData> {
  const events = await cacheThrough('planning:month', CACHE_TTL.weekAhead, () =>
    fetchAllCalendarEvents('month'),
  );
  return {
    weekAhead: buildWeekAhead(events),
    family: buildFamilyDates(events),
    reservations: buildReservations(events),
  };
}
