import type { Attendee, Meeting } from '@/lib/data';

export type TodayPerson = Attendee & {
  meetingTitle: string;
  meetingTime: string;
  introducedBy?: string;
  relationshipContext?: string;
  angle?: string;
  conversationTip?: string;
  /** True when every meeting this person appears in today is a recurring series. */
  recurring?: boolean;
  /** Set when the email history shows something awaiting Kory's reply/decision. */
  actionNeeded?: boolean;
  actionNote?: string;
};

const KORY_PATTERN = /kory\s*mitchell/i;

function companyFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (!domain || /^(gmail|yahoo|hotmail|outlook|icloud|me|live)\./i.test(domain)) return '';
  const base = domain.split('.')[0] ?? '';
  return base ? base.charAt(0).toUpperCase() + base.slice(1).replace(/-/g, ' ') : '';
}

export function isKoryAttendee(name: string): boolean {
  return KORY_PATTERN.test(name.trim());
}

/** Outlook sometimes lists the same person twice on one invite. */
export function dedupeAttendees<T extends { name: string; email?: string }>(
  attendees: T[],
  excludeKory = false,
): T[] {
  const seen = new Set<string>();
  return attendees.filter((a) => {
    if (excludeKory && isKoryAttendee(a.name)) return false;
    const key = (a.email ?? a.name).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Unique attendees from today's real meetings (excludes Kory), earliest meeting first. */
export function buildTodayPeopleFromMeetings(meetings: Meeting[]): TodayPerson[] {
  const seen = new Map<string, TodayPerson>();
  const realMeetings = [...meetings]
    .filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting')
    .sort((a, b) => (a.startIso ?? a.time).localeCompare(b.startIso ?? b.time));

  for (const meeting of realMeetings) {
    const recurring = meeting.isRecurring ?? false;
    for (const attendee of meeting.attendees) {
      if (isKoryAttendee(attendee.name)) continue;
      const key = attendee.name.trim().toLowerCase();
      const existing = seen.get(key);
      if (existing) {
        // A person is only "recurring" if EVERY meeting they're in today recurs.
        if (!recurring) existing.recurring = false;
        continue;
      }
      seen.set(key, {
        ...attendee,
        company: attendee.company || (attendee.email ? companyFromEmail(attendee.email) : ''),
        meetingTitle: meeting.title,
        meetingTime: meeting.time,
        recurring,
      });
    }
  }

  return [...seen.values()];
}
