'use client';

import { useEffect, useState } from 'react';
import { Bot, CalendarClock, CheckSquare, CircleDot } from 'lucide-react';
import type { LexiSummary } from '@/lib/lexi/service';

function fmtSlot(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function LexiPanel() {
  const [data, setData] = useState<LexiSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/lexi/summary')
        .then((r) => r.json())
        .then((d: LexiSummary) => {
          if (alive) setData(d);
        })
        .catch(() => {
          if (alive) setData({ available: false });
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const online = !!data?.available;
  const healthy = online && data?.health?.db_ok && !data?.health?.worker_heartbeat_stale;
  const pending = data?.pendingApprovals?.count ?? 0;
  const holds = data?.holds?.active ?? [];

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,245,238,0.5))', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(90deg, var(--bg-nav) 0%, var(--bg-panel-accent) 100%)', borderBottom: '1px solid rgba(201,160,68,0.18)', padding: '14px 20px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} style={{ color: 'var(--gold-light)' }} />
            </div>
            <div>
              <div style={{ color: 'var(--gold-light)', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Lexi Assistant</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 1 }}>Your scheduling agent · read-only</div>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 700, color: healthy ? 'var(--success)' : online ? 'var(--warning)' : 'var(--text-muted)' }}>
            <CircleDot size={12} />
            {loading ? 'Checking…' : healthy ? 'Online' : online ? 'Degraded' : 'Offline'}
          </div>
        </div>
      </div>

      {!online ? (
        <div style={{ padding: '18px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          Lexi is offline right now. Pending approvals, holds, and activity will appear here when the agent is running.
        </div>
      ) : (
        <div style={{ padding: '16px 20px' }} className="space-y-4">
          {/* Top stat row */}
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<CheckSquare size={14} />} label="Pending approvals" value={String(pending)} hint={pending ? 'approve in Teams' : 'all clear'} />
            <Stat icon={<CalendarClock size={14} />} label="Active holds" value={String(holds.length)} hint="on your calendar" />
          </div>

          {/* Active holds */}
          {holds.length > 0 && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Active holds</div>
              <div className="space-y-1">
                {holds.slice(0, 4).map((h) => (
                  <div key={`${h.proposal_id}-${h.slot_start}`} className="flex items-center justify-between" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{h.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{fmtSlot(h.slot_start)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity feed */}
          {data?.activity && data.activity.length > 0 && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>What Lexi did recently</div>
              <div className="space-y-1">
                {data.activity.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: 74 }}>{fmtSlot(a.timestamp)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div style={{ background: 'var(--bg-nav)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px' }}>
      <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {icon}
        {label}
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, marginTop: 2 }}>{value}</div>
      {hint && <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{hint}</div>}
    </div>
  );
}
