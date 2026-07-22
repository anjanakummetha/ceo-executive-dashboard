'use client';

import { useEffect, useState } from 'react';
import { CalendarRange, Cake, Users, UtensilsCrossed, Plane, Shield, AlertTriangle } from 'lucide-react';
import type { PlanningData, DayDensity, FamilyDate, ReservationItem } from '@/lib/planning/service';

const RES_STORAGE_KEY = 'ceo-dashboard.reservations.done';

function densityColor(hours: number): string {
  if (hours >= 6) return 'var(--danger)';
  if (hours >= 4) return 'var(--warning)';
  if (hours >= 1) return 'var(--success)';
  return 'var(--border-subtle)';
}

const kindMeta: Record<FamilyDate['kind'], { icon: React.ReactNode; color: string }> = {
  birthday: { icon: <Cake size={12} />, color: 'var(--gold-light)' },
  kid: { icon: <Users size={12} />, color: 'var(--info)' },
  family: { icon: <Users size={12} />, color: 'var(--success)' },
  'do-not-move': { icon: <Shield size={12} />, color: 'var(--danger)' },
};

export default function WeekAheadPanel() {
  const [data, setData] = useState<PlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RES_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only init reading localStorage, must run after mount (SSR-safe)
      if (raw) setDone(JSON.parse(raw));
    } catch { /* ignore */ }
    fetch('/api/planning')
      .then((r) => r.json())
      .then((d: PlanningData & { ok?: boolean }) => setData(d))
      .catch(() => setData({ weekAhead: [], family: [], reservations: [] }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(RES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  if (loading) return null;
  if (!data) return null;

  const week: DayDensity[] = data.weekAhead ?? [];
  const family: FamilyDate[] = data.family ?? [];
  const reservations: ReservationItem[] = (data.reservations ?? []).filter((r) => r.needsReservation);
  const maxHours = Math.max(1, ...week.map((d) => d.meetingHours));

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,245,238,0.5))', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(90deg, var(--bg-nav) 0%, var(--bg-panel-accent) 100%)', borderBottom: '1px solid rgba(201,160,68,0.18)', padding: '14px 20px' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarRange size={16} style={{ color: 'var(--gold-light)' }} />
          </div>
          <div>
            <div style={{ color: 'var(--gold-light)', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Week Ahead</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 1 }}>Density · protected time · personal dates · reservations</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }} className="space-y-4">
        {/* Density bars */}
        <div className="grid grid-cols-7 gap-2">
          {week.map((d) => (
            <div key={d.date} style={{ textAlign: 'center' }}>
              <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div title={`${d.meetingHours}h · ${d.meetingCount} meetings`} style={{
                  width: 20,
                  height: `${Math.max(4, (d.meetingHours / maxHours) * 56)}px`,
                  background: d.travel ? 'var(--info)' : densityColor(d.meetingHours),
                  borderRadius: 4,
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{d.weekday}</div>
              <div className="flex items-center justify-center gap-0.5" style={{ minHeight: 14 }}>
                {d.travel && <Plane size={11} style={{ color: 'var(--info)' }} />}
                {d.protected && <Shield size={11} style={{ color: 'var(--gold-light)' }} />}
                {d.backToBackWarning && <AlertTriangle size={11} style={{ color: 'var(--warning)' }} />}
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Family & personal dates */}
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Family & personal (30 days)</div>
            {family.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nothing flagged.</div>
            ) : (
              <div className="space-y-1">
                {family.slice(0, 8).map((f, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: kindMeta[f.kind].color, display: 'inline-flex' }}>{kindMeta[f.kind].icon}</span>
                    <span style={{ color: 'var(--text-muted)', minWidth: 58 }}>{f.weekday} {f.date.slice(5)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reservation checklist */}
          <div>
            <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              <UtensilsCrossed size={12} /> Reservations to confirm
            </div>
            {reservations.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No reservations needed in the next 14 days.</div>
            ) : (
              <div className="space-y-1">
                {reservations.slice(0, 8).map((r) => (
                  <label key={r.id} className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!done[r.id]} onChange={() => toggle(r.id)} />
                    <span style={{ color: 'var(--text-muted)', minWidth: 58 }}>{r.weekday} {r.date.slice(5)}</span>
                    <span style={{ textDecoration: done[r.id] ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title} <span style={{ color: 'var(--text-muted)' }}>· {r.reason}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
