'use client';

import { useState } from 'react';
import { Flag, AlertTriangle, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { topPriorities, type TopPriority } from '@/lib/data';

const sourceIcon: Record<string, string> = {
  email: '✉',
  calendar: '📅',
  hubspot: '🔶',
  asana: '🔷',
  linkedin: '💼',
  personal: '⭐',
};

const priorityColors = {
  critical: { bg: 'rgba(224,82,82,0.15)', border: 'rgba(224,82,82,0.4)', text: '#e05252', label: 'CRITICAL' },
  high: { bg: 'rgba(224,154,68,0.15)', border: 'rgba(224,154,68,0.4)', text: '#e09a44', label: 'HIGH' },
  medium: { bg: 'rgba(201,160,68,0.12)', border: 'rgba(201,160,68,0.3)', text: '#c9a044', label: 'MEDIUM' },
  low: { bg: 'rgba(76,175,130,0.12)', border: 'rgba(76,175,130,0.3)', text: '#4caf82', label: 'LOW' },
};

export default function TopPriorities() {
  const [items, setItems] = useState<TopPriority[]>(topPriorities);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const toggleFlag = (id: string) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, flagged: !p.flagged } : p));
  };

  const markComplete = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const activeCount = items.filter(i => !completedIds.has(i.id)).length;

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, rgba(201,160,68,0.08) 0%, rgba(50,50,50,0.95) 100%)',
        border: '1px solid rgba(201,160,68,0.35)',
        borderLeft: '4px solid #c9a044',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(201,160,68,0.1)',
      }}
      className="p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            style={{ background: 'linear-gradient(135deg, #c9a044, #d4af60)' }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
          >
            <Zap size={15} className="text-[#2a2a2a]" />
          </div>
          <div>
            <div className="section-title">Top Priorities</div>
            <div className="text-gray-400 text-xs">{activeCount} action items requiring attention</div>
          </div>
        </div>
        <span className="badge-gold">{activeCount} Active</span>
      </div>

      {/* Priority items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) => {
          const pc = priorityColors[item.priority];
          const done = completedIds.has(item.id);
          return (
            <div
              key={item.id}
              style={{
                background: done ? 'rgba(76,175,130,0.08)' : pc.bg,
                border: `1px solid ${done ? 'rgba(76,175,130,0.3)' : pc.border}`,
                borderRadius: '10px',
                opacity: done ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              className="p-3 relative"
            >
              {/* Priority badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{sourceIcon[item.source]}</span>
                  <span
                    style={{ color: done ? '#4caf82' : pc.text, fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px' }}
                  >
                    {done ? 'DONE' : pc.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.actionRequired && !done && (
                    <AlertTriangle size={13} style={{ color: '#e09a44' }} />
                  )}
                  <button
                    onClick={() => toggleFlag(item.id)}
                    className="flag-btn"
                    title={item.flagged ? 'Remove flag' : 'Flag this item'}
                  >
                    <Flag
                      size={13}
                      fill={item.flagged ? '#c9a044' : 'none'}
                      style={{ color: item.flagged ? '#c9a044' : '#666' }}
                    />
                  </button>
                  <button
                    onClick={() => markComplete(item.id)}
                    className="flag-btn"
                    title={done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    <CheckCircle2
                      size={13}
                      fill={done ? '#4caf82' : 'none'}
                      style={{ color: done ? '#4caf82' : '#666' }}
                    />
                  </button>
                </div>
              </div>

              <p
                style={{
                  color: done ? '#9a9a9a' : '#e0e0e0',
                  textDecoration: done ? 'line-through' : 'none',
                  fontSize: '13px',
                  lineHeight: '1.4',
                }}
                className="font-medium mb-2"
              >
                {item.title}
              </p>

              {item.dueTime && !done && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: pc.text }} />
                  <span style={{ color: pc.text, fontSize: '11px', fontWeight: 600 }}>
                    Due: {item.dueTime}
                  </span>
                </div>
              )}

              {item.actionRequired && !done && (
                <button
                  style={{
                    background: 'rgba(201,160,68,0.15)',
                    border: '1px solid rgba(201,160,68,0.3)',
                    borderRadius: '6px',
                    color: '#c9a044',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Take Action <ArrowRight size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
