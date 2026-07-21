/**
 * Client-side analytics derived from data the dashboard already fetched
 * (calendar, inbox, Asana). Zero extra Composio cost — pure functions.
 *
 * Tuned for Kory (IFG founder-CEO): the metrics that matter to him are
 * focus-time protection (his mornings are his after the 8 AM trainer block),
 * external vs. internal load, who's waiting on a reply, and what's slipping.
 */

import type { Email, Meeting, AsanaTask } from '@/lib/data';

const MT = 'America/Denver';

// Kory's protected morning: trainer wraps ~8:00; first meeting shouldn't land before 8:30.
const MORNING_PROTECT_UNTIL_MIN = 8 * 60 + 30;
// Focus-gap search window across the working day (MT minutes-from-midnight).
const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 18 * 60;

function parseDurationMin(duration: string | undefined): number {
  if (!duration) return 30;
  const h = duration.match(/(\d+(?:\.\d+)?)\s*h/i);
  const m = duration.match(/(\d+)\s*m/i);
  let mins = 0;
  if (h) mins += Math.round(parseFloat(h[1]) * 60);
  if (m) mins += parseInt(m[1], 10);
  if (!mins) {
    const n = duration.match(/(\d+)/);
    if (n) mins = parseInt(n[1], 10);
  }
  return mins || 30;
}

/** Minutes-from-midnight in MT for an ISO timestamp. */
function mtMinutes(iso: string): number | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MT,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? NaN);
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? NaN);
  if (isNaN(hh) || isNaN(mm)) return null;
  return (hh % 24) * 60 + mm;
}

function fmtMinLabel(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function fmtHours(totalMin: number): string {
  if (totalMin <= 0) return '0h';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const EXTERNAL_HINTS = /iconicfounders\.com/i;

export interface MeetingAnalytics {
  count: number;
  totalMinutes: number;
  externalCount: number;
  internalCount: number;
  backToBackCount: number;
  largestGapMin: number;
  largestGapLabel: string;
  prepReadyCount: number;
  morningProtected: boolean;
  loadPct: number; // share of the 8a–6p working day booked
}

export function meetingAnalytics(meetings: Meeting[]): MeetingAnalytics {
  const real = (meetings || []).filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting');

  // Build sorted [start,end) intervals in MT minutes from startIso.
  const intervals = real
    .map((m) => {
      const start = m.startIso ? mtMinutes(m.startIso) : null;
      if (start == null) return null;
      return { start, end: start + parseDurationMin(m.duration) };
    })
    .filter((x): x is { start: number; end: number } => x != null)
    .sort((a, b) => a.start - b.start);

  let totalMinutes = 0;
  let backToBackCount = 0;
  for (let i = 0; i < intervals.length; i++) {
    totalMinutes += intervals[i].end - intervals[i].start;
    if (i > 0 && intervals[i].start - intervals[i - 1].end <= 5) backToBackCount++;
  }

  // Largest free gap inside the working day.
  let largestGapMin = 0;
  let largestGapLabel = '';
  let cursor = DAY_START_MIN;
  const consider = (from: number, to: number) => {
    const gap = to - from;
    if (gap > largestGapMin) {
      largestGapMin = gap;
      largestGapLabel = `${fmtMinLabel(from)} – ${fmtMinLabel(to)}`;
    }
  };
  for (const iv of intervals) {
    if (iv.start > cursor) consider(cursor, Math.min(iv.start, DAY_END_MIN));
    cursor = Math.max(cursor, iv.end);
    if (cursor >= DAY_END_MIN) break;
  }
  if (cursor < DAY_END_MIN) consider(cursor, DAY_END_MIN);

  const externalCount = real.filter((m) =>
    m.attendees?.some((a) => a.email && !EXTERNAL_HINTS.test(a.email)),
  ).length;

  const prepReadyCount = real.filter(
    (m) => (m.agenda && m.agenda.trim()) || (m.aiTalkingPoints && m.aiTalkingPoints.length > 0),
  ).length;

  const firstStart = intervals.length ? intervals[0].start : null;
  const morningProtected = firstStart == null || firstStart >= MORNING_PROTECT_UNTIL_MIN;

  const workingMin = DAY_END_MIN - DAY_START_MIN;
  const loadPct = Math.min(100, Math.round((totalMinutes / workingMin) * 100));

  return {
    count: real.length,
    totalMinutes,
    externalCount,
    internalCount: Math.max(0, real.length - externalCount),
    backToBackCount,
    largestGapMin,
    largestGapLabel,
    prepReadyCount,
    morningProtected,
    loadPct,
  };
}

export interface InboxAnalytics {
  total: number;
  unread: number;
  needsReply: number;
  vipWaiting: number;
  flagged: number;
  negativeCount: number;
  avgSentiment: number;
  byTriage: { key: string; label: string; count: number }[];
}

const REPLY_TRIAGE = new Set(['urgent-reply', 'revenue', 'deep-response', 'emotionally-sensitive']);
const VIP_CATEGORY = new Set(['board', 'finance', 'legal']);

export function inboxAnalytics(emails: Email[]): InboxAnalytics {
  const list = emails || [];
  const unreadList = list.filter((e) => e.unread);
  const needsReply = list.filter(
    (e) => e.unread && (REPLY_TRIAGE.has(e.aiTriage) || e.priority === 'critical' || e.priority === 'high'),
  ).length;
  const vipWaiting = list.filter(
    (e) => e.unread && (VIP_CATEGORY.has(e.aiCategory) || e.priority === 'critical'),
  ).length;
  const flagged = list.filter((e) => e.flagged).length;
  const negativeCount = list.filter((e) => e.sentimentScore < -0.2).length;
  const avgSentiment = list.length
    ? list.reduce((s, e) => s + (e.sentimentScore || 0), 0) / list.length
    : 0;

  const triageOrder: { key: string; label: string }[] = [
    { key: 'urgent-reply', label: 'Urgent reply' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'deep-response', label: 'Deep response' },
    { key: 'delegate', label: 'Delegate' },
    { key: 'quick-reply', label: 'Quick reply' },
    { key: 'fyi', label: 'FYI' },
  ];
  const byTriage = triageOrder
    .map((t) => ({ ...t, count: list.filter((e) => e.aiTriage === t.key).length }))
    .filter((t) => t.count > 0);

  return {
    total: list.length,
    unread: unreadList.length,
    needsReply,
    vipWaiting,
    flagged,
    negativeCount,
    avgSentiment,
    byTriage,
  };
}

function daysOverdueFrom(dueDate: string): number {
  const m = dueDate?.match(/(\d+)\s+days?\s+ago/i);
  if (m) return parseInt(m[1], 10);
  if (/yesterday/i.test(dueDate || '')) return 1;
  return 0;
}

export interface TaskAnalytics {
  total: number;
  overdue: number;
  dueToday: number;
  inProgress: number;
  upcoming: number;
  maxDaysOverdue: number;
  oldestOverdueTitle?: string;
  byPriority: { key: string; label: string; count: number }[];
}

export function taskAnalytics(tasks: AsanaTask[]): TaskAnalytics {
  const list = tasks || [];
  const overdue = list.filter((t) => t.status === 'overdue');
  let maxDaysOverdue = 0;
  let oldestOverdueTitle: string | undefined;
  for (const t of overdue) {
    const d = daysOverdueFrom(t.dueDate);
    if (d > maxDaysOverdue) {
      maxDaysOverdue = d;
      oldestOverdueTitle = t.title;
    }
  }
  const prioOrder: { key: AsanaTask['priority']; label: string }[] = [
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];
  const byPriority = prioOrder
    .map((p) => ({ ...p, count: list.filter((t) => t.priority === p.key).length }))
    .filter((p) => p.count > 0);

  return {
    total: list.length,
    overdue: overdue.length,
    dueToday: list.filter((t) => t.status === 'due-today').length,
    inProgress: list.filter((t) => t.status === 'in-progress').length,
    upcoming: list.filter((t) => t.status === 'upcoming').length,
    maxDaysOverdue,
    oldestOverdueTitle,
    byPriority,
  };
}
