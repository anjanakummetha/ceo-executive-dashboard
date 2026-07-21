'use client';

/**
 * Shared executive-dashboard UI kit: interactive stat tiles, distribution bars,
 * and progress rings. Theme-driven (CSS vars), light-touch motion, professional.
 */

import { useState, type ReactNode } from 'react';

export function StatTile({
  icon,
  label,
  value,
  hint,
  accent = 'var(--gold-primary)',
  tone = 'neutral',
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const toneColor =
    tone === 'good' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : accent;
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick()) : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`glass-tile sheen ${onClick ? 'lift press' : ''}`}
      style={{
        border: `1px solid ${hover && onClick ? toneColor : 'rgba(255,255,255,0.55)'}`,
        padding: '13px 15px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: toneColor, opacity: 0.55 }} />
      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {icon ? <span style={{ color: toneColor, display: 'inline-flex' }}>{icon}</span> : null}
        {label}
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800, marginTop: 3, lineHeight: 1.1, letterSpacing: '-0.5px' }}>{value}</div>
      {hint ? <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
}

export function MiniBars({
  items,
  max,
}: {
  items: { key: string; label: string; count: number; color?: string }[];
  max?: number;
}) {
  const peak = max ?? Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)', fontSize: 11, width: 96, flexShrink: 0 }}>{it.label}</span>
          <div style={{ flex: 1, height: 7, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round((it.count / peak) * 100)}%`,
                height: '100%',
                borderRadius: 4,
                background: it.color ?? 'linear-gradient(90deg, var(--gold-dark), var(--gold-primary))',
                transition: 'width .5s ease',
              }}
            />
          </div>
          <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, width: 22, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{it.count}</span>
        </div>
      ))}
    </div>
  );
}

export function Ring({
  value,
  size = 64,
  stroke = 7,
  color = 'var(--gold-primary)',
  track = 'var(--bg-secondary)',
  center,
  sub,
}: {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  center?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      {center ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-primary)', fontSize: size >= 60 ? 15 : 12, fontWeight: 800, lineHeight: 1 }}>{center}</span>
          {sub ? <span style={{ color: 'var(--text-muted)', fontSize: 8.5, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>{sub}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Section heading used inside analytics panels. */
export function PanelHeading({ icon, title, subtitle, right }: { icon?: ReactNode; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(90deg, var(--bg-nav) 0%, var(--bg-panel-accent) 100%)' }}>
      <div className="flex items-center gap-3">
        {icon ? (
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)' }}>{icon}</div>
        ) : null}
        <div>
          <div style={{ color: 'var(--gold-primary)', fontSize: 12, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{title}</div>
          {subtitle ? <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{subtitle}</div> : null}
        </div>
      </div>
      {right}
    </div>
  );
}
