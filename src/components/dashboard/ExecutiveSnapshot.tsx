'use client';

import { CalendarDays, Inbox, ListChecks, Focus, ShieldCheck, Zap } from 'lucide-react';
import { useSync } from '@/components/dashboard/SyncProvider';
import type { TabId } from '@/components/dashboard/TabNav';
import { meetingAnalytics, inboxAnalytics, taskAnalytics, fmtHours } from '@/lib/analytics/derive';
import { StatTile, Ring } from '@/components/dashboard/ui/StatKit';
import { SpotlightCard } from '@/components/dashboard/ui/Spatial';

function greeting(): string {
  const h = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', hour: 'numeric', hour12: false }).format(new Date()),
  );
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

export default function ExecutiveSnapshot({ onNavigate }: { onNavigate?: (tab: TabId) => void }) {
  const { meetings, emails, tasks } = useSync();
  const m = meetingAnalytics(meetings);
  const inbox = inboxAnalytics(emails);
  const t = taskAnalytics(tasks);

  const focusTone = m.largestGapMin >= 90 ? 'good' : m.largestGapMin >= 60 ? 'neutral' : 'warn';
  const loadColor = m.loadPct >= 75 ? 'var(--danger)' : m.loadPct >= 50 ? 'var(--warning)' : 'var(--success)';

  // Kory-personal focus-guardian line.
  let guardian: { icon: React.ReactNode; text: string; color: string };
  if (!m.morningProtected) {
    guardian = { icon: <Zap size={13} />, text: 'A meeting is booked before 8:30 AM — your post-trainer morning block is not fully protected today.', color: 'var(--warning)' };
  } else if (m.backToBackCount >= 3) {
    guardian = { icon: <Zap size={13} />, text: `${m.backToBackCount} back-to-back meetings today — protect a reset between them.`, color: 'var(--warning)' };
  } else if (m.largestGapMin >= 90) {
    guardian = { icon: <ShieldCheck size={13} />, text: `Morning protected. Largest focus block: ${m.largestGapLabel} (${fmtHours(m.largestGapMin)}) — guard it.`, color: 'var(--success)' };
  } else if (m.count === 0) {
    guardian = { icon: <ShieldCheck size={13} />, text: 'Open calendar today — a rare chance for deep work.', color: 'var(--success)' };
  } else {
    guardian = { icon: <ShieldCheck size={13} />, text: `Morning protected. Best focus window: ${m.largestGapLabel || '—'}.`, color: 'var(--gold-primary)' };
  }

  return (
    <SpotlightCard className="glass-panel">
      {/* Hero header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.45)' }}>
        <div>
          <div className="float-title" style={{ color: 'var(--text-primary)', fontSize: 21, fontWeight: 800 }}>{greeting()}, Kory</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{todayLabel()} · here&apos;s your day at a glance</div>
        </div>
        <div className="flex items-center gap-3">
          <Ring value={m.loadPct} size={62} stroke={7} color={loadColor} center={`${m.loadPct}%`} sub="booked" />
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ padding: '16px 20px' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<Focus size={13} />}
            label="Focus time"
            value={m.largestGapMin > 0 ? fmtHours(m.largestGapMin) : 'None'}
            hint={m.largestGapLabel || 'fully booked'}
            tone={focusTone}
            onClick={onNavigate ? () => onNavigate('meetings') : undefined}
          />
          <StatTile
            icon={<CalendarDays size={13} />}
            label="Meetings today"
            value={String(m.count)}
            hint={`${fmtHours(m.totalMinutes)} · ${m.externalCount} external`}
            onClick={onNavigate ? () => onNavigate('meetings') : undefined}
          />
          <StatTile
            icon={<Inbox size={13} />}
            label="Needs reply"
            value={String(inbox.needsReply)}
            hint={inbox.vipWaiting ? `${inbox.vipWaiting} VIP waiting` : `${inbox.unread} unread`}
            tone={inbox.vipWaiting > 0 ? 'warn' : 'neutral'}
            onClick={onNavigate ? () => onNavigate('inbox') : undefined}
          />
          <StatTile
            icon={<ListChecks size={13} />}
            label="Overdue tasks"
            value={String(t.overdue)}
            hint={t.dueToday ? `${t.dueToday} due today` : t.overdue ? `oldest ${t.maxDaysOverdue}d` : 'all clear'}
            tone={t.overdue > 0 ? 'danger' : 'good'}
            onClick={onNavigate ? () => onNavigate('tasks') : undefined}
          />
        </div>

        {/* Kory-personal focus guardian */}
        <div className="flex items-start gap-2" style={{ marginTop: 14, padding: '11px 14px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${guardian.color}`, borderRadius: '0 10px 10px 0' }}>
          <span style={{ color: guardian.color, flexShrink: 0, marginTop: 1 }}>{guardian.icon}</span>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.5 }}>{guardian.text}</p>
        </div>
      </div>
    </SpotlightCard>
  );
}
