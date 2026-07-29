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

/** IFG's own domains — colleagues, not people Kory needs a background brief on. */
const IFG_DOMAIN = /@(iconicfounders\.com|ifg\.vc)$/i;

/** IFG people by name, for colleagues who appear on a personal address.
 *
 * Domain matching alone is not enough: Sujash joins invites as
 * sjbarman@ucdavis.edu, and whether his work address is also on the invite
 * varies. Names are stable where addresses are not. Override with
 * IFG_TEAM_NAMES (comma-separated) as the team changes. */
const IFG_TEAM_NAMES = (
  process.env.IFG_TEAM_NAMES ??
  process.env.NEXT_PUBLIC_IFG_TEAM_NAMES ??
  'Kory Mitchell,Heidi Heckler,Natalie Asher,Matt Maley,Jason Quesada,Sujash Barman'
)
  .split(',')
  .map((n) => n.trim().toLowerCase())
  .filter(Boolean);

/**
 * True for Kory's own team.
 *
 * Only Kory was excluded from the attendee roster, so research ran on Heidi,
 * Natalie, Matt and Sujash and came back with nothing useful — which is most of
 * why the bios read as thin. Colleagues still appear as attendees; they just do
 * not get researched, and they stay out of the morning email's guest list.
 */
export function isInternalAttendee(person: { name?: string; email?: string }): boolean {
  const email = (person.email ?? '').trim();
  if (email && IFG_DOMAIN.test(email)) return true;
  const name = (person.name ?? '').trim().toLowerCase();
  if (name && IFG_TEAM_NAMES.includes(name)) return true;
  return isKoryAttendee(person.name ?? '');
}

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
        // A colleague can sit on one invite twice — Sujash appears on both his
        // IFG address and his university one. Whichever landed first won the
        // dedupe, so his personal address could make a teammate look external.
        // The work address always wins.
        if (attendee.email && IFG_DOMAIN.test(attendee.email) && !IFG_DOMAIN.test(existing.email ?? '')) {
          existing.email = attendee.email;
          existing.company = attendee.company || companyFromEmail(attendee.email);
        }
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
