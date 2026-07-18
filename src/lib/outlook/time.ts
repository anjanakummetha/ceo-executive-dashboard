/** Mountain Time — all calendar display and Outlook parsing use this zone. */
export const MOUNTAIN_TIMEZONE = 'America/Denver';

const TZ = MOUNTAIN_TIMEZONE;

/** Microsoft Graph / Windows names → IANA */
const WINDOWS_TO_IANA: Record<string, string> = {
  'Mountain Standard Time': MOUNTAIN_TIMEZONE,
  'Pacific Standard Time': 'America/Los_Angeles',
  'Central Standard Time': 'America/Chicago',
  'Eastern Standard Time': 'America/New_York',
  UTC: 'UTC',
  GMT: 'UTC',
};

export function normalizeOutlookTimeZone(timeZone?: string): string {
  if (!timeZone?.trim()) return TZ;
  const key = timeZone.trim();
  if (WINDOWS_TO_IANA[key]) return WINDOWS_TO_IANA[key];
  try {
    Intl.DateTimeFormat(undefined, { timeZone: key });
    return key;
  } catch {
    return TZ;
  }
}

/**
 * Graph returns `dateTime` as wall-clock in `timeZone` without a Z suffix.
 * `new Date(iso)` wrongly treats that string as the viewer's local zone.
 */
export function parseOutlookDateTimeToUtcIso(dateTime: string, timeZone: string): string {
  const normalized = dateTime.replace(/\.\d+/, '').trim();
  if (!normalized) return new Date().toISOString();
  if (/Z$/i.test(normalized) || /[+-]\d{2}:\d{2}$/.test(normalized)) {
    return new Date(normalized).toISOString();
  }

  const [datePart, timePart = '00:00:00'] = normalized.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [hh, mm, ss = '0'] = timePart.split(':');
  const wallMs = Date.UTC(y, mo - 1, d, Number(hh), Number(mm), Number(ss));

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  function partsToUtc(parts: Intl.DateTimeFormatPart[]): number {
    const get = (t: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === t)?.value);
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  }

  let utc = wallMs;
  for (let i = 0; i < 4; i++) {
    const shown = partsToUtc(fmt.formatToParts(new Date(utc)));
    utc += wallMs - shown;
  }
  return new Date(utc).toISOString();
}

function isValidInstant(iso: string): boolean {
  if (!iso || /^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return !Number.isNaN(new Date(iso).getTime());
}

/** YYYY-MM-DD in Mountain Time for an event start (UTC ISO or all-day date). */
export function mtDateKeyFromIso(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  if (!isValidInstant(iso)) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
}

/** YYYY-MM-DD in Mountain Time */
export function todayMtDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
}

export function mtDayBounds(date = new Date()): { start: string; end: string; date: string } {
  const dateStr = todayMtDateString(date);
  return {
    date: dateStr,
    start: `${dateStr}T00:00:00`,
    end: `${dateStr}T23:59:59`,
  };
}

export function mtRangeBounds(daysAhead: number): { start: string; end: string } {
  return mtRangeBoundsAround(0, daysAhead);
}

export function mtRangeBoundsAround(daysPast: number, daysAhead: number): { start: string; end: string } {
  const start = new Date();
  start.setDate(start.getDate() - daysPast);
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);
  const startStr = todayMtDateString(start);
  const endStr = todayMtDateString(end);
  return {
    start: `${startStr}T00:00:00`,
    end: `${endStr}T23:59:59`,
  };
}

/** e.g. "Thu, Jun 5" in Mountain Time */
export function formatDateLabelMt(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, mo, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  if (!isValidInstant(iso)) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  });
}

export function formatTimeMt(iso: string, isAllDay: boolean): string {
  if (isAllDay) return 'All day';
  if (!isValidInstant(iso)) return '—';
  const d = new Date(iso);
  const t = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  });
  return `${t} MT`;
}

export function formatDurationMinutes(startIso: string, endIso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(startIso) && /^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
    const start = Date.parse(`${startIso}T12:00:00Z`);
    const end = Date.parse(`${endIso}T12:00:00Z`);
    const days = Math.max(1, Math.round((end - start) / 86400000));
    return days === 1 ? 'All day' : `${days} days`;
  }
  if (!isValidInstant(startIso) || !isValidInstant(endIso)) return '—';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
