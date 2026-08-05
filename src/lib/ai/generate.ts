import type { AIPriorityItem, AsanaTask, Email, Meeting, OverdueTask } from '@/lib/data';
import { readAiCache, writeAiCache } from '@/lib/ai/cache-store';
import type {
  AttendeeEmailContext,
  AttendeeIntel,
  AttendeeIntelBundle,
  EmailThreadSnippet,
  IntelConfidence,
} from '@/lib/ai/types';
import { buildEmailContextsForPeople } from '@/lib/outlook/attendee-email-context';
import { buildAttendeeHistories, type AttendeeHistory } from '@/lib/outlook/attendee-history';
import {
  attendeeIntelPrompt,
  dailyBriefingPrompt,
  inboxAnalysisPrompt,
  prioritiesPrompt,
} from '@/lib/ai/prompts';
import {
  briefingForToday,
  defaultEmailRecipient,
  formatBriefingDeliveryLabel,
  writeDailyBriefing,
  type DailyBriefingRecord,
} from '@/lib/briefing/store';
import { extractJson } from '@/lib/hermes/parse-json';
import { runHermesCompletion, runHermesResearch } from '@/lib/hermes/cli';
import { buildTodayPeopleFromMeetings, isInternalAttendee } from '@/lib/outlook/meeting-people';
import { todayMtDateString } from '@/lib/outlook/time';
import { loadTodaySnapshot, type TodaySnapshot } from '@/lib/sync/today-snapshot';

function parseDaysOverdue(dueDate: string): number {
  const m = dueDate.match(/(\d+)\s+days?\s+ago/i);
  if (m) return parseInt(m[1], 10);
  if (/yesterday/i.test(dueDate)) return 1;
  return 1;
}

export function overdueFromSnapshot(snapshot: TodaySnapshot): OverdueTask[] {
  return snapshot.tasks
    .filter((t) => t.status === 'overdue')
    .map((t) => ({
      title: t.title,
      source: 'asana' as const,
      daysOverdue: parseDaysOverdue(t.dueDate),
      priority: t.priority,
      project: t.project,
    }));
}

export async function generatePriorities(snapshot?: TodaySnapshot): Promise<AIPriorityItem[]> {
  const cached = readAiCache<AIPriorityItem[]>('priorities', 'all');
  if (cached) return cached;

  const data = snapshot ?? (await loadTodaySnapshot());
  const raw = await runHermesCompletion(prioritiesPrompt(data));
  const parsed = extractJson<{ items: AIPriorityItem[] }>(raw);
  const items = parsed.items ?? [];
  writeAiCache('priorities', 'all', items);
  return items;
}

type Section = { heading: string; points: string[] };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain-text briefing built from the same sections the dashboard shows. */
function briefToProse(sections: Section[], insights: string[]): string {
  const parts = sections.map(
    (s) => `${s.heading}\n${s.points.map((p) => `- ${p}`).join('\n')}`,
  );
  if (insights.length) {
    parts.push(`Key insights\n${insights.map((i) => `- ${i}`).join('\n')}`);
  }
  return parts.join('\n\n');
}

/** HTML email body, same content. */
function briefToHtml(sections: Section[], insights: string[]): string {
  const block = (heading: string, points: string[]) =>
    `<h3>${escapeHtml(heading)}</h3><ul>${points
      .map((p) => `<li>${escapeHtml(p)}</li>`)
      .join('')}</ul>`;
  const parts = sections.map((s) => block(s.heading, s.points));
  if (insights.length) parts.push(block('Key insights', insights));
  return parts.join('');
}

// --- morning email -------------------------------------------------------
// Inline styles only: Outlook strips <style> blocks, and tables/flex render
// unpredictably across clients. Plain blocks survive everywhere.

const EMAIL_WRAP =
  'font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;' +
  'font-size:15px;line-height:1.55;color:#23282f;max-width:640px;';
const H2 =
  'font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
  'color:#9a7b2f;margin:26px 0 10px;';
const LI = 'margin:0 0 8px;';

/** Safety cap on fully-briefed guests. Every FIRST-TIME external guest gets the
 *  full treatment (that is what a prebrief is for); recurring guests compact to
 *  a name-and-time line because Kory already knows them. Six full briefs is a
 *  very unusual day and keeps the email from running away. */
const PEOPLE_IN_FULL = 6;

/** How many unread (non-flagged) inbox lines the email carries before counting
 *  the rest — the dashboard has the full list. */
const UNREAD_IN_EMAIL = 8;
const FLAGGED_IN_EMAIL = 10;

/** Everything the 4:45 AM email carries. All of it is data the dashboard
 *  already fetched for the day — composing costs no extra model calls. */
export interface MorningEmailInput {
  dateLabel: string;
  insights: string[];
  sections: Section[];
  /** Full day from the calendar snapshot — meetings AND blocks/holds. */
  schedule?: Meeting[];
  /** Every Asana task due today. */
  dueToday?: AsanaTask[];
  overdue: OverdueTask[];
  /** Inbox snapshot — flagged and unread items travel with the email. */
  inbox?: Email[];
  linkedInUnread?: number;
  people: AttendeeIntel[];
  /** False when overnight attendee research failed and `people` is the
   *  calendar roster only — the email says so instead of silently thinning. */
  peopleResearchOk?: boolean;
}

const MUTED = 'color:#6b7280;';
const SMALL_MUTED = 'color:#6b7280;font-size:13px;';

function sortByStart(schedule: Meeting[]): Meeting[] {
  return [...schedule].sort((a, b) => (a.startIso ?? '').localeCompare(b.startIso ?? ''));
}

/** "7:00 AM — Keystone QofE (45 min · Shift · video)  With: Hank Tanner +2" */
function scheduleHtmlItems(schedule: Meeting[]): string[] {
  const ordered = sortByStart(schedule);
  const meetings = ordered.filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting');
  const blocks = ordered.filter((m) => (m.scheduleKind ?? 'meeting') !== 'meeting');

  const items = meetings.map((m) => {
    const meta = [m.duration, m.location, m.type === 'video' ? 'video' : m.type === 'phone' ? 'phone' : '']
      .filter(Boolean)
      .join(' · ');
    const names = m.attendees.map((a) => a.name);
    const shown = names.slice(0, 4).join(', ');
    const extra = names.length > 4 ? ` +${names.length - 4}` : '';
    return (
      `<strong>${escapeHtml(m.time)}</strong> — ${escapeHtml(m.title)}` +
      (meta ? ` <span style="${SMALL_MUTED}">(${escapeHtml(meta)})</span>` : '') +
      (names.length
        ? `<br><span style="${SMALL_MUTED}">With: ${escapeHtml(shown + extra)}</span>`
        : '')
    );
  });

  if (blocks.length) {
    items.push(
      `<span style="${MUTED}">Blocks &amp; holds: ` +
        escapeHtml(blocks.map((b) => `${b.time} ${b.title}`).join(' · ')) +
        `</span>`,
    );
  }
  return items;
}

function scheduleTextItems(schedule: Meeting[]): string[] {
  const ordered = sortByStart(schedule);
  const meetings = ordered.filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting');
  const blocks = ordered.filter((m) => (m.scheduleKind ?? 'meeting') !== 'meeting');
  const items = meetings.map((m) => {
    const meta = [m.duration, m.location, m.type === 'video' ? 'video' : m.type === 'phone' ? 'phone' : '']
      .filter(Boolean)
      .join(' · ');
    const names = m.attendees.map((a) => a.name);
    const shown = names.slice(0, 4).join(', ');
    const extra = names.length > 4 ? ` +${names.length - 4}` : '';
    return `${m.time} — ${m.title}${meta ? ` (${meta})` : ''}${names.length ? `\n    With: ${shown}${extra}` : ''}`;
  });
  if (blocks.length) {
    items.push(`Blocks & holds: ${blocks.map((b) => `${b.time} ${b.title}`).join(' · ')}`);
  }
  return items;
}

function taskMeta(t: AsanaTask): string {
  const priority = t.priority === 'critical' || t.priority === 'high' ? `${t.priority} priority` : '';
  return [t.project, priority].filter(Boolean).join(' · ');
}

function dueTodayHtmlItems(dueToday: AsanaTask[]): string[] {
  return dueToday.map((t) => {
    const meta = taskMeta(t);
    return `${escapeHtml(t.title)}${meta ? ` <span style="${SMALL_MUTED}">— ${escapeHtml(meta)}</span>` : ''}`;
  });
}

function dueTodayTextItems(dueToday: AsanaTask[]): string[] {
  return dueToday.map((t) => {
    const meta = taskMeta(t);
    return `${t.title}${meta ? ` — ${meta}` : ''}`;
  });
}

/** Flagged first (all of them), then the newest unread, then the count of the
 *  rest — the raw fields the Inbox tab shows, with no model call. */
function inboxHtmlItems(inbox: Email[], linkedInUnread: number): string[] {
  const flagged = inbox.filter((e) => e.flagged);
  const unread = inbox.filter((e) => e.unread && !e.flagged);
  const items = flagged
    .slice(0, FLAGGED_IN_EMAIL)
    .map(
      (e) =>
        `<strong>${escapeHtml(e.sender)}</strong> — ${escapeHtml(e.subject)} ` +
        `<span style="${SMALL_MUTED}">(flagged · ${escapeHtml(e.time)})</span>`,
    );
  if (flagged.length > FLAGGED_IN_EMAIL) {
    items.push(`<span style="${MUTED}">${flagged.length - FLAGGED_IN_EMAIL} more flagged — dashboard.</span>`);
  }
  items.push(
    ...unread
      .slice(0, UNREAD_IN_EMAIL)
      .map(
        (e) =>
          `${escapeHtml(e.sender)} — ${escapeHtml(e.subject)} ` +
          `<span style="${SMALL_MUTED}">(${escapeHtml(e.time)})</span>`,
      ),
  );
  if (unread.length > UNREAD_IN_EMAIL) {
    items.push(`<span style="${MUTED}">${unread.length - UNREAD_IN_EMAIL} more unread — dashboard.</span>`);
  }
  if (linkedInUnread > 0) {
    items.push(`<span style="${MUTED}">LinkedIn: ${linkedInUnread} unread message${linkedInUnread === 1 ? '' : 's'}.</span>`);
  }
  return items;
}

function inboxTextItems(inbox: Email[], linkedInUnread: number): string[] {
  const flagged = inbox.filter((e) => e.flagged);
  const unread = inbox.filter((e) => e.unread && !e.flagged);
  const items = flagged
    .slice(0, FLAGGED_IN_EMAIL)
    .map((e) => `${e.sender} — ${e.subject} (flagged · ${e.time})`);
  if (flagged.length > FLAGGED_IN_EMAIL) items.push(`${flagged.length - FLAGGED_IN_EMAIL} more flagged — dashboard.`);
  items.push(...unread.slice(0, UNREAD_IN_EMAIL).map((e) => `${e.sender} — ${e.subject} (${e.time})`));
  if (unread.length > UNREAD_IN_EMAIL) items.push(`${unread.length - UNREAD_IN_EMAIL} more unread — dashboard.`);
  if (linkedInUnread > 0) items.push(`LinkedIn: ${linkedInUnread} unread message${linkedInUnread === 1 ? '' : 's'}.`);
  return items;
}

/** First-timers all get the full brief; recurring guests compact unless the
 *  email history shows something awaiting Kory. */
function splitPeople(externals: AttendeeIntel[]): {
  detailed: AttendeeIntel[];
  remainder: AttendeeIntel[];
} {
  const fresh = externals.filter((p) => !p.recurring);
  const familiar = externals.filter((p) => p.recurring);
  const promoted = familiar.filter((p) => p.actionNeeded && p.actionNote);
  const detailed = [...fresh, ...promoted].slice(0, PEOPLE_IN_FULL);
  const keep = new Set(detailed);
  const remainder = externals.filter((p) => !keep.has(p));
  return { detailed, remainder };
}

const RESEARCH_DOWN_NOTE =
  'Overnight research did not run — names and times are from the calendar; full briefs are on the dashboard.';

function trim(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[\s,;:.]+\S*$/, '')}…`;
}

/** A real person's name, or "" for the placeholders that say nothing. */
function namedIntroducer(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  if (/^(unknown|direct outreach|n\/?a|none)$/i.test(value)) return '';
  return value;
}

function isEmptyBio(raw: string | undefined): boolean {
  const value = (raw ?? '').trim();
  return (
    !value ||
    /^(limited public information available\.?|no ai bio generated\.?)$/i.test(value)
  );
}

function emailSection(heading: string, items: string[]): string {
  if (!items.length) return '';
  return (
    `<div style="${H2}">${escapeHtml(heading)}</div>` +
    `<ul style="margin:0;padding-left:20px;">` +
    items.map((i) => `<li style="${LI}">${i}</li>`).join('') +
    `</ul>`
  );
}

/** The 4:45 AM email: what Kory needs before the day starts. */
export function composeMorningEmailHtml(input: MorningEmailInput): string {
  const { dateLabel, insights, sections, overdue, people } = input;
  const schedule = input.schedule ?? [];
  const dueToday = input.dueToday ?? [];
  const inbox = input.inbox ?? [];

  const overdueItems = [...overdue]
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .map((t) => {
      const meta = t.project ? ` <span style="${SMALL_MUTED}">· ${escapeHtml(t.project)}</span>` : '';
      return `${escapeHtml(t.title)} — <span style="color:#b3261e;font-weight:600;">${t.daysOverdue}d overdue</span>${meta}`;
    });

  // The email has to work without opening the dashboard, so the fields Kory
  // cannot reconstruct on his own travel with it: who introduced them, what is
  // outstanding, and what to aim for. The prior-relationship narrative is the
  // longest block and the most reconstructable, so it stays on the dashboard.
  const externals = people.filter((p) => !isInternalAttendee({ name: p.name, email: p.email }));
  const { detailed, remainder } = splitPeople(externals);

  const line = (label: string, value: string, colour = '#23282f') =>
    `<br><span style="font-size:14px;color:${colour};">` +
    `<span style="color:#6b7280;">${label}</span> ${escapeHtml(value)}</span>`;

  const peopleItems = detailed.map((p) => {
    const role = escapeHtml(p.emailContext?.companyGuess ?? '');
    const when = escapeHtml([p.meetingTime, p.meetingTitle].filter(Boolean).join(' · '));
    const introducer = namedIntroducer(p.introducedBy);
    const outstanding = p.actionNeeded && p.actionNote ? String(p.actionNote) : '';
    // "Limited public information available" is honest on the dashboard and
    // pure noise in an email — drop it rather than spend a line saying nothing.
    const bio = isEmptyBio(p.bio) ? '' : String(p.bio);

    return (
      `<strong>${escapeHtml(p.name)}</strong>${role ? ` — ${role}` : ''}` +
      (when ? `<br><span style="color:#6b7280;font-size:13px;">${when}</span>` : '') +
      (introducer ? line('Introduced by', introducer) : '') +
      (outstanding ? line('⚠', trim(outstanding, 220), '#8a5a00') : '') +
      (p.angle ? line('Angle:', trim(String(p.angle), 240)) : '') +
      (!introducer && !outstanding && !p.angle && bio
        ? `<br><span style="font-size:14px;">${escapeHtml(trim(bio, 200))}</span>`
        : '')
    );
  });

  if (remainder.length) {
    peopleItems.push(
      `<span style="color:#6b7280;">Also meeting: </span>` +
        remainder
          .map((p) => `${escapeHtml(p.name)}${p.meetingTime ? ` (${escapeHtml(p.meetingTime)})` : ''}`)
          .join(', ') +
        ` <span style="color:#6b7280;">— full briefs on the dashboard.</span>`,
    );
  }
  if (peopleItems.length && input.peopleResearchOk === false) {
    peopleItems.push(`<span style="${MUTED}">${escapeHtml(RESEARCH_DOWN_NOTE)}</span>`);
  }

  const body =
    emailSection('Key insights', insights.map(escapeHtml)) +
    sections.map((s) => emailSection(s.heading, s.points.map(escapeHtml))).join('') +
    emailSection("Today's schedule", scheduleHtmlItems(schedule)) +
    emailSection("Today's people", peopleItems) +
    emailSection('Due today', dueTodayHtmlItems(dueToday)) +
    emailSection('Overdue', overdueItems) +
    emailSection('Inbox — flagged & unread', inboxHtmlItems(inbox, input.linkedInUnread ?? 0));

  return (
    `<div style="${EMAIL_WRAP}">` +
    `<div style="font-size:19px;font-weight:700;margin:0 0 2px;">Good morning, Kory</div>` +
    `<div style="color:#6b7280;font-size:13px;">${escapeHtml(dateLabel)}</div>` +
    (body ||
      `<p style="margin-top:22px;">Nothing needing your attention this morning.</p>`) +
    `<div style="margin-top:30px;padding-top:12px;border-top:1px solid #e5e7eb;` +
    `color:#9ca3af;font-size:12px;">Generated from your calendar, inbox and Asana. ` +
    `Open the dashboard for the full picture.</div>` +
    `</div>`
  );
}

/** Same people content as the HTML, flattened. */
function peopleTextItems(people: AttendeeIntel[], researchOk: boolean): string[] {
  const externals = people.filter((p) => !isInternalAttendee({ name: p.name, email: p.email }));
  const { detailed, remainder } = splitPeople(externals);
  const items = detailed.map((p) => {
    const head = [
      p.name,
      p.emailContext?.companyGuess ?? '',
      [p.meetingTime, p.meetingTitle].filter(Boolean).join(' · '),
    ]
      .filter(Boolean)
      .join(' | ');
    const introducer = namedIntroducer(p.introducedBy);
    const outstanding = p.actionNeeded && p.actionNote ? String(p.actionNote) : '';
    const extras = [
      introducer ? `    Introduced by ${introducer}` : '',
      outstanding ? `    ! ${trim(outstanding, 220)}` : '',
      p.angle ? `    Angle: ${trim(String(p.angle), 240)}` : '',
    ].filter(Boolean);
    // Same fallback as the HTML: a real bio only when nothing more useful exists.
    if (!extras.length && !isEmptyBio(p.bio)) {
      extras.push(`    ${trim(String(p.bio), 200)}`);
    }
    return [head, ...extras].join('\n');
  });

  if (remainder.length) {
    items.push(
      `Also meeting: ${remainder
        .map((p) => `${p.name}${p.meetingTime ? ` (${p.meetingTime})` : ''}`)
        .join(', ')} — full briefs on the dashboard.`,
    );
  }
  if (items.length && !researchOk) items.push(RESEARCH_DOWN_NOTE);
  return items;
}

/** Plain-text twin, for clients that refuse HTML. */
export function composeMorningEmailText(input: MorningEmailInput): string {
  const { dateLabel, insights, sections, overdue, people } = input;
  const part = (heading: string, items: string[]) =>
    items.length ? `${heading.toUpperCase()}\n${items.map((i) => `- ${i}`).join('\n')}\n` : '';

  return [
    `Good morning, Kory`,
    dateLabel,
    '',
    part('Key insights', insights),
    ...sections.map((s) => part(s.heading, s.points)),
    part("Today's schedule", scheduleTextItems(input.schedule ?? [])),
    part("Today's people", peopleTextItems(people, input.peopleResearchOk !== false)),
    part('Due today', dueTodayTextItems(input.dueToday ?? [])),
    part(
      'Overdue',
      [...overdue]
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
        .map(
          (t) =>
            `${t.title} — ${t.daysOverdue}d overdue${t.project ? ` · ${t.project}` : ''}`,
        ),
    ),
    part('Inbox — flagged & unread', inboxTextItems(input.inbox ?? [], input.linkedInUnread ?? 0)),
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateDailyBriefing(
  snapshot?: TodaySnapshot,
): Promise<DailyBriefingRecord> {
  const data = snapshot ?? (await loadTodaySnapshot());
  const overdue = overdueFromSnapshot(data);
  const raw = await runHermesCompletion(dailyBriefingPrompt(data, overdue));
  const parsed = extractJson<{
    keyInsights: string[];
    conversationalBrief: string;
    briefSections?: Array<{ heading?: string; points?: string[] }>;
    weatherCondition?: string;
    temperature?: string;
    emailDraft: { subject: string; bodyText: string; bodyHtml: string };
  }>(raw);

  // Drop any section the model emitted with nothing in it — an empty heading
  // reads as a bug, and the prompt already asks for omission over padding.
  const briefSections = (parsed.briefSections ?? [])
    .map((s) => ({
      heading: String(s.heading ?? '').trim(),
      points: (s.points ?? []).map((p) => String(p).trim()).filter(Boolean),
    }))
    .filter((s) => s.heading && s.points.length > 0);

  const now = new Date();
  const keyInsights = parsed.keyInsights ?? [];
  // Assemble the prose and the email from the same sections the dashboard
  // renders, so the three versions cannot drift apart — and so the model writes
  // the briefing once instead of four times.
  const record: DailyBriefingRecord = {
    date: todayMtDateString(),
    generatedAt: formatBriefingDeliveryLabel(now.toISOString()),
    generatedAtIso: now.toISOString(),
    overdueTasks: overdue,
    keyInsights,
    briefSections,
    weatherCondition: parsed.weatherCondition ?? '—',
    temperature: parsed.temperature ?? '—',
    conversationalBrief: briefToProse(briefSections, keyInsights),
    emailDraft: {
      to: defaultEmailRecipient(),
      subject: `CEO Daily Briefing — ${data.date}`,
      bodyText: briefToProse(briefSections, keyInsights),
      bodyHtml: briefToHtml(briefSections, keyInsights),
    },
    source: 'hermes',
  };

  // The morning email carries the full day — schedule, people, tasks, inbox —
  // so it stands on its own without opening the dashboard. Attendee intel is
  // generated here rather than fetched later so the 4:45 run warms that cache
  // for the day; a research failure downgrades the people section to the
  // calendar roster (with an honest note) rather than silently dropping it.
  let people: AttendeeIntel[] = [];
  let peopleResearchOk = true;
  try {
    people = (await generateAttendeeIntel(data)).people ?? [];
  } catch {
    peopleResearchOk = false;
    people = rosterOnlyPeople(data);
  }
  const emailInput: MorningEmailInput = {
    dateLabel: data.date,
    insights: keyInsights,
    sections: briefSections,
    schedule: data.meetings,
    dueToday: data.tasks.filter((t) => t.status === 'due-today'),
    overdue,
    inbox: data.emails,
    linkedInUnread: data.linkedInUnread,
    people,
    peopleResearchOk,
  };
  record.emailDraft.bodyHtml = composeMorningEmailHtml(emailInput);
  record.emailDraft.bodyText = composeMorningEmailText(emailInput);

  writeDailyBriefing(record);
  return record;
}

export async function getOrGenerateDailyBriefing(): Promise<DailyBriefingRecord> {
  const existing = briefingForToday();
  if (existing) return existing;
  return generateDailyBriefing();
}

function intelKey(name: string, email?: string): string {
  return email?.trim().toLowerCase() || name.trim().toLowerCase();
}

/** What the email shows when overnight research fails: the roster straight
 *  from the calendar plus whatever the inbox snapshot already knows about each
 *  person. Costs no model call — the point is that the people section never
 *  silently disappears (it did on 2026-08-05 when the research call 500'd). */
export function rosterOnlyPeople(snapshot: TodaySnapshot): AttendeeIntel[] {
  const roster = buildTodayPeopleFromMeetings(snapshot.meetings);
  const contexts = buildEmailContextsForPeople(
    roster.map((p) => ({ name: p.name, email: p.email })),
    snapshot.emails,
  );
  return roster.map((p) => {
    const ctx = contexts.get(intelKey(p.name, p.email)) ?? null;
    return {
      name: p.name,
      email: p.email,
      meetingTitle: p.meetingTitle,
      meetingTime: p.meetingTime,
      emailContext: ctx
        ? { ...ctx, companyGuess: ctx.companyGuess || p.company || '' }
        : { email: p.email ?? '', companyGuess: p.company ?? '', messageCount: 0, snippets: [] },
      bio: '',
      introducedBy: '',
      relationshipContext: '',
      angle: '',
      conversationTip: '',
      confidence: 'low',
      recurring: Boolean(p.recurring),
      actionNeeded: false,
      actionNote: '',
    };
  });
}

function normalizeConfidence(c: string | undefined): IntelConfidence {
  if (c === 'high' || c === 'medium' || c === 'low') return c;
  return 'medium';
}

/** Merge the inbox-snapshot snippets with the full-mailbox history into the
 * stored context that drives the "Prior relationship" card + meeting talking
 * points. Only from_them / to_them messages are stored (third-party "other"
 * messages inform the LLM's introducedBy but aren't shown as their history). */
function mergeStoredContext(
  ctx: AttendeeEmailContext | null,
  history: AttendeeHistory | null,
  email?: string,
): AttendeeEmailContext | null {
  const snippets: EmailThreadSnippet[] = [];
  const seen = new Set<string>();
  const push = (
    subject: string,
    preview: string,
    time: string,
    direction: 'from_them' | 'to_them',
  ) => {
    const k = `${subject}|${time}`;
    if (seen.has(k)) return;
    seen.add(k);
    snippets.push({ subject, preview, time, direction });
  };

  for (const s of ctx?.snippets ?? []) push(s.subject, s.preview, s.time, s.direction);
  for (const s of history?.snippets ?? []) {
    if (s.direction === 'other') continue;
    push(s.subject, s.preview, s.date, s.direction);
  }

  if (!snippets.length && !ctx) return null;
  return {
    email: ctx?.email ?? (email ? email.trim().toLowerCase() : ''),
    companyGuess: ctx?.companyGuess ?? '',
    messageCount: history?.messageCount ?? ctx?.messageCount ?? snippets.length,
    snippets: snippets.slice(0, 6),
  };
}

/** One Hermes research call/day. Relationship context is grounded in the inbox
 * snapshot PLUS a full-mailbox search per non-recurring attendee (who introduced
 * them / first contact). Recurring attendees skip research but are still checked
 * for a pending action. */
export async function generateAttendeeIntel(snapshot?: TodaySnapshot): Promise<AttendeeIntelBundle> {
  const cached = readAiCache<AttendeeIntelBundle>('attendee-intel', 'all');
  if (cached?.people?.length) return { ...cached, source: 'cache' };

  const data = snapshot ?? (await loadTodaySnapshot());
  const roster = buildTodayPeopleFromMeetings(data.meetings);
  if (roster.length === 0) {
    return { people: [], generatedAt: new Date().toISOString(), source: 'hermes' };
  }

  const emailContexts = buildEmailContextsForPeople(
    roster.map((p) => ({ name: p.name, email: p.email })),
    data.emails,
  );
  const histories = await buildAttendeeHistories(
    roster.map((p) => ({ name: p.name, email: p.email, recurring: p.recurring })),
  );

  const promptPeople = roster.map((p) => {
    const key = intelKey(p.name, p.email);
    const ctx = emailContexts.get(key) ?? null;
    const history = histories.get(key) ?? null;
    // Colleagues are listed but never researched — Kory knows them, and the
    // search spend was landing on his own team.
    const internal = isInternalAttendee({ name: p.name, email: p.email });

    const historySnippets = (history?.snippets ?? []).map((s) => ({
      subject: s.subject,
      preview: s.preview,
      direction: s.direction,
      date: s.date,
      from: s.from,
      to: s.to,
      cc: s.cc,
    }));
    const inboxSnippets = (ctx?.snippets ?? []).map((s) => ({
      subject: s.subject,
      preview: s.preview,
      direction: s.direction,
    }));

    return {
      name: p.name,
      email: p.email,
      meetingTitle: p.meetingTitle,
      meetingTime: p.meetingTime,
      recurring: Boolean(p.recurring),
      internal,
      companyGuess: ctx?.companyGuess || p.company || '',
      firstContact: history?.firstContact
        ? {
            date: history.firstContact.date,
            from: history.firstContact.from,
            to: history.firstContact.to,
            cc: history.firstContact.cc,
            subject: history.firstContact.subject,
            preview: history.firstContact.preview,
          }
        : null,
      // The full-mailbox trail (with participants) beats the inbox snippets for
      // spotting an introducer; fall back to inbox-only when search found nothing.
      snippets: historySnippets.length ? historySnippets : inboxSnippets,
    };
  });

  const raw = await runHermesResearch(attendeeIntelPrompt(promptPeople, data.meetings));
  const parsed = extractJson<{
    people: Array<{
      name: string;
      bio: string;
      introducedBy?: string;
      relationshipContext?: string;
      angle?: string;
      conversationTip?: string;
      actionNeeded?: boolean;
      actionNote?: string;
      confidence?: string;
    }>;
  }>(raw);

  const byName = new Map((parsed.people ?? []).map((p) => [p.name.trim().toLowerCase(), p]));

  const people: AttendeeIntel[] = roster.map((p) => {
    const key = intelKey(p.name, p.email);
    const ai = byName.get(p.name.trim().toLowerCase());
    const emailContext = mergeStoredContext(
      emailContexts.get(key) ?? null,
      histories.get(key) ?? null,
      p.email,
    );
    return {
      name: p.name,
      email: p.email,
      meetingTitle: p.meetingTitle,
      meetingTime: p.meetingTime,
      emailContext,
      bio: ai?.bio ?? (p.recurring ? '' : 'No AI bio generated.'),
      introducedBy: ai?.introducedBy ?? '',
      relationshipContext: ai?.relationshipContext ?? '',
      angle: ai?.angle ?? '',
      conversationTip: ai?.conversationTip ?? '',
      confidence: normalizeConfidence(ai?.confidence),
      recurring: Boolean(p.recurring),
      actionNeeded: Boolean(ai?.actionNeeded),
      actionNote: ai?.actionNote ?? '',
    };
  });

  const bundle: AttendeeIntelBundle = {
    people,
    generatedAt: new Date().toISOString(),
    source: 'hermes',
  };
  writeAiCache('attendee-intel', 'all', bundle);
  return bundle;
}

/** @deprecated use generateAttendeeIntel — kept for compatibility */
export async function generateAttendeeBios(snapshot?: TodaySnapshot): Promise<Record<string, string>> {
  const bundle = await generateAttendeeIntel(snapshot);
  const map: Record<string, string> = {};
  for (const p of bundle.people) {
    map[intelKey(p.name, p.email)] = p.bio;
  }
  return map;
}

export async function generateInboxAnalysis(emails: Email[]): Promise<Email[]> {
  const top = emails.slice(0, 15);
  const cached = readAiCache<Email[]>('inbox', 'batch');
  if (cached) {
    const byId = new Map(cached.map((e) => [e.id, e]));
    return emails.map((e) => byId.get(e.id) ?? e);
  }

  const payload = top.map((e) => ({
    id: e.id,
    sender: e.sender,
    subject: e.subject,
    preview: e.preview?.slice(0, 400),
    unread: e.unread,
  }));

  const raw = await runHermesCompletion(inboxAnalysisPrompt(payload));
  const parsed = extractJson<{
    emails: Array<{
      id: string;
      aiSummary: string;
      aiCategory: Email['aiCategory'];
      aiTriage: Email['aiTriage'];
      sentimentScore: number;
      draftReply?: string;
    }>;
  }>(raw);

  const patch = new Map((parsed.emails ?? []).map((x) => [x.id, x]));
  const merged = emails.map((e) => {
    const ai = patch.get(e.id);
    if (!ai) return e;
    return {
      ...e,
      aiSummary: ai.aiSummary,
      aiCategory: ai.aiCategory,
      aiTriage: ai.aiTriage,
      sentimentScore: ai.sentimentScore,
      draftReply: ai.draftReply || undefined,
    };
  });

  writeAiCache('inbox', 'batch', merged.filter((e) => patch.has(e.id)));
  return merged;
}
