/** Default timezone for Kory; override with TIMEZONE in .env */
export const DEFAULT_TIMEZONE =
  process.env.TIMEZONE || process.env.NEXT_PUBLIC_TIMEZONE || 'America/Denver';

export function getClientTimezone(): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return DEFAULT_TIMEZONE;
}

export function formatTime(
  date: Date | string = new Date(),
  options?: { timeZone?: string; hour12?: boolean },
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: options?.hour12 ?? true,
    timeZone: options?.timeZone,
  });
}

export function formatDate(
  date: Date | string = new Date(),
  options?: { timeZone?: string; weekday?: boolean },
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: options?.weekday ? 'long' : undefined,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: options?.timeZone,
  });
}

export function todayDateString(timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone ?? DEFAULT_TIMEZONE,
  }).format(new Date());
}

export function formatRelativeTime(iso: string, timeZone?: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone });
}
