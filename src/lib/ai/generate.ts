import type { AIPriorityItem, Email, OverdueTask } from '@/lib/data';
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

export async function generateDailyBriefing(
  snapshot?: TodaySnapshot,
): Promise<DailyBriefingRecord> {
  const data = snapshot ?? (await loadTodaySnapshot());
  const overdue = overdueFromSnapshot(data);
  const raw = await runHermesCompletion(dailyBriefingPrompt(data, overdue));
  const parsed = extractJson<{
    keyInsights: string[];
    conversationalBrief: string;
    weatherCondition?: string;
    temperature?: string;
    emailDraft: { subject: string; bodyText: string; bodyHtml: string };
  }>(raw);

  const now = new Date();
  const record: DailyBriefingRecord = {
    date: todayMtDateString(),
    generatedAt: formatBriefingDeliveryLabel(now.toISOString()),
    generatedAtIso: now.toISOString(),
    overdueTasks: overdue,
    keyInsights: parsed.keyInsights ?? [],
    weatherCondition: parsed.weatherCondition ?? '—',
    temperature: parsed.temperature ?? '—',
    conversationalBrief: parsed.conversationalBrief ?? '',
    emailDraft: {
      to: defaultEmailRecipient(),
      subject: parsed.emailDraft?.subject ?? `CEO Daily Briefing — ${data.date}`,
      bodyText: parsed.emailDraft?.bodyText ?? parsed.conversationalBrief ?? '',
      bodyHtml: parsed.emailDraft?.bodyHtml ?? `<p>${parsed.conversationalBrief ?? ''}</p>`,
    },
    source: 'hermes',
  };

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
