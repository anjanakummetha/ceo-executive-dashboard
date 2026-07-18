import type { AIPriorityItem, Email, OverdueTask } from '@/lib/data';
import { readAiCache, writeAiCache } from '@/lib/ai/cache-store';
import type { AttendeeIntel, AttendeeIntelBundle, IntelConfidence } from '@/lib/ai/types';
import { buildEmailContextsForPeople } from '@/lib/outlook/attendee-email-context';
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
import { runHermesCompletion } from '@/lib/hermes/cli';
import { buildTodayPeopleFromMeetings } from '@/lib/outlook/meeting-people';
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

/** One Hermes call/day; email context from cached inbox only (no extra Outlook API). */
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

  const promptPeople = roster.map((p) => {
    const ctx = emailContexts.get(intelKey(p.name, p.email)) ?? null;
    return {
      name: p.name,
      email: p.email,
      meetingTitle: p.meetingTitle,
      meetingTime: p.meetingTime,
      emailContext: ctx
        ? {
            companyGuess: ctx.companyGuess,
            snippets: ctx.snippets.map((s) => ({
              subject: s.subject,
              preview: s.preview,
              direction: s.direction,
            })),
          }
        : null,
    };
  });

  const raw = await runHermesCompletion(attendeeIntelPrompt(promptPeople, data.meetings));
  const parsed = extractJson<{
    people: Array<{
      name: string;
      bio: string;
      relationshipContext?: string;
      conversationTip?: string;
      confidence?: string;
    }>;
  }>(raw);

  const byName = new Map((parsed.people ?? []).map((p) => [p.name.trim().toLowerCase(), p]));

  const people: AttendeeIntel[] = roster.map((p) => {
    const key = intelKey(p.name, p.email);
    const ai = byName.get(p.name.trim().toLowerCase());
    const emailContext = emailContexts.get(key) ?? null;
    return {
      name: p.name,
      email: p.email,
      meetingTitle: p.meetingTitle,
      meetingTime: p.meetingTime,
      emailContext,
      bio: ai?.bio ?? 'No AI bio generated.',
      relationshipContext: ai?.relationshipContext ?? '',
      conversationTip: ai?.conversationTip ?? '',
      confidence: normalizeConfidence(ai?.confidence),
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
