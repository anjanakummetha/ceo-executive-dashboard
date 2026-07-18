import type { Email } from '@/lib/data';
import type { AttendeeEmailContext, EmailThreadSnippet } from '@/lib/ai/types';

const MAX_SNIPPETS = 4;
const PREVIEW_MAX = 200;

function norm(email: string): string {
  return email.trim().toLowerCase();
}

function companyFromDomain(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (!domain || /^(gmail|yahoo|hotmail|outlook|icloud|me|live)\./i.test(domain)) return '';
  const base = domain.split('.')[0] ?? '';
  if (!base) return '';
  return base.charAt(0).toUpperCase() + base.slice(1).replace(/-/g, ' ');
}

function senderAddress(email: Email): string {
  if (email.senderEmail) return norm(email.senderEmail);
  const m = email.sender.match(/<([^>]+)>/);
  if (m?.[1]) return norm(m[1]);
  if (email.sender.includes('@')) return norm(email.sender);
  return '';
}

function recipientAddresses(email: Email): string[] {
  const text = email.recipient ?? '';
  const found = [...text.matchAll(/<([^>]+)>/g)].map((m) => norm(m[1]));
  if (found.length) return found;
  if (text.includes('@')) return [norm(text)];
  return [];
}

/** Match inbox rows already loaded in today's snapshot — zero extra Outlook API calls. */
export function buildEmailContextForAttendee(
  attendeeEmail: string | undefined,
  attendeeName: string,
  inbox: Email[],
): AttendeeEmailContext | null {
  const key = attendeeEmail ? norm(attendeeEmail) : '';
  const nameLower = attendeeName.trim().toLowerCase();
  const snippets: EmailThreadSnippet[] = [];

  for (const msg of inbox) {
    const from = senderAddress(msg);
    const toList = recipientAddresses(msg);
    let direction: 'from_them' | 'to_them' | null = null;

    if (key) {
      if (from === key) direction = 'from_them';
      else if (toList.includes(key)) direction = 'to_them';
    } else if (nameLower.length > 2) {
      if (msg.sender.toLowerCase().includes(nameLower)) direction = 'from_them';
      else if ((msg.recipient ?? '').toLowerCase().includes(nameLower)) direction = 'to_them';
    }

    if (!direction) continue;

    snippets.push({
      subject: msg.subject,
      preview: msg.preview.slice(0, PREVIEW_MAX),
      time: msg.time,
      direction,
    });
    if (snippets.length >= MAX_SNIPPETS) break;
  }

  if (!snippets.length && !key) return null;

  return {
    email: key,
    companyGuess: key ? companyFromDomain(key) : '',
    messageCount: snippets.length,
    snippets,
  };
}

export function buildEmailContextsForPeople(
  people: Array<{ name: string; email?: string }>,
  inbox: Email[],
): Map<string, AttendeeEmailContext | null> {
  const map = new Map<string, AttendeeEmailContext | null>();
  for (const p of people) {
    const cacheKey = p.email ? norm(p.email) : p.name.trim().toLowerCase();
    if (map.has(cacheKey)) continue;
    map.set(cacheKey, buildEmailContextForAttendee(p.email, p.name, inbox));
  }
  return map;
}
