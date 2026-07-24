import {
  historyQueryForPerson,
  searchOutlookMessages,
  type OutlookHistoryMessage,
} from '@/lib/outlook/search-service';

/**
 * Turns raw mailbox search results into the "how does Kory know this person"
 * context the briefing needs: the FIRST contact (where an introduction lives)
 * plus a chronological trail of the earliest and most recent exchanges, each
 * with its participants so the LLM can spot a third-party introducer.
 */

export type HistoryDirection = 'from_them' | 'to_them' | 'other';

export interface HistorySnippet {
  subject: string;
  preview: string;
  direction: HistoryDirection;
  date: string;
  from: string;
  to: string[];
  cc: string[];
}

export interface AttendeeHistory {
  firstContact: HistorySnippet | null;
  snippets: HistorySnippet[];
  messageCount: number;
}

function attendeeSearchMax(): number {
  const n = Number(process.env.DASHBOARD_ATTENDEE_SEARCH_MAX ?? 12);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 25) : 12;
}

function attendeeSearchTop(): number {
  const n = Number(process.env.DASHBOARD_ATTENDEE_SEARCH_TOP ?? 15);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 25) : 15;
}

function mailSearchEnabled(): boolean {
  return (process.env.DASHBOARD_ATTENDEE_MAIL_SEARCH ?? 'true') !== 'false';
}

function directionFor(msg: OutlookHistoryMessage, email?: string): HistoryDirection {
  const key = email?.trim().toLowerCase() ?? '';
  if (!key) return 'other';
  if (msg.fromEmail === key) return 'from_them';
  const inRecipients = [...msg.to, ...msg.cc].some((r) => r.toLowerCase().includes(key));
  if (inRecipients) return 'to_them';
  return 'other';
}

function toSnippet(msg: OutlookHistoryMessage, email?: string): HistorySnippet {
  const fromName = msg.fromName || msg.fromEmail;
  const from = msg.fromEmail && fromName ? `${fromName} <${msg.fromEmail}>` : fromName || msg.fromEmail;
  return {
    subject: msg.subject,
    preview: msg.preview,
    direction: directionFor(msg, email),
    date: msg.receivedIso,
    from,
    to: msg.to.slice(0, 4),
    cc: msg.cc.slice(0, 4),
  };
}

/** Run tasks with a small concurrency cap so we never fan out dozens of calls at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length || 1)).fill(0).map(async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Build the earliest-first history trail for one person from their mail search. */
export async function buildAttendeeHistory(
  name: string,
  email: string | undefined,
  top: number,
): Promise<AttendeeHistory> {
  const query = historyQueryForPerson(name, email);
  if (!query) return { firstContact: null, snippets: [], messageCount: 0 };

  const messages = (await searchOutlookMessages(query, top)).filter((m) => m.receivedIso);
  if (!messages.length) return { firstContact: null, snippets: [], messageCount: 0 };

  const chronological = [...messages].sort((a, b) => a.receivedIso.localeCompare(b.receivedIso));
  const earliest = chronological.slice(0, 3);
  const latest = chronological.slice(-3);

  // Merge earliest + latest, dedupe by id-equivalent (subject|date), keep chronological.
  const seen = new Set<string>();
  const merged: HistorySnippet[] = [];
  for (const msg of [...earliest, ...latest]) {
    const k = `${msg.subject}|${msg.receivedIso}`;
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(toSnippet(msg, email));
  }
  merged.sort((a, b) => a.date.localeCompare(b.date));

  return {
    firstContact: toSnippet(chronological[0], email),
    snippets: merged,
    messageCount: messages.length,
  };
}

/**
 * Fetch mail history for a set of people (skips those flagged recurring, since
 * recurring internal syncs don't need "who introduced them"). Returns a Map
 * keyed by lowercased email-or-name. Degrades to empty on any failure.
 */
export async function buildAttendeeHistories(
  people: Array<{ name: string; email?: string; recurring?: boolean }>,
): Promise<Map<string, AttendeeHistory>> {
  const map = new Map<string, AttendeeHistory>();
  if (!mailSearchEnabled()) return map;

  const targets = people
    .filter((p) => !p.recurring)
    .slice(0, attendeeSearchMax());
  const top = attendeeSearchTop();

  const histories = await mapWithConcurrency(targets, 4, (p) =>
    buildAttendeeHistory(p.name, p.email, top),
  );

  targets.forEach((p, i) => {
    const key = p.email?.trim().toLowerCase() || p.name.trim().toLowerCase();
    map.set(key, histories[i]);
  });
  return map;
}
