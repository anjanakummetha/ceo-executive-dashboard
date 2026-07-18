'use client';

import { useState } from 'react';
import { Flag, ExternalLink, Clock } from 'lucide-react';
import { asanaTasks, type AsanaTask } from '@/lib/data';

const statusConfig = {
  overdue: { color: 'var(--danger)', bg: 'rgba(224,82,82,0.12)', label: 'OVERDUE' },
  'due-today': { color: 'var(--warning)', bg: 'rgba(224,154,68,0.12)', label: 'DUE TODAY' },
  'in-progress': { color: 'var(--info)', bg: 'rgba(74,158,214,0.12)', label: 'IN PROGRESS' },
  upcoming: { color: 'var(--success)', bg: 'rgba(76,175,130,0.12)', label: 'UPCOMING' },
};

const priorityColors = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--gold-light)',
  low: 'var(--success)',
};

export default function AsanaPanel() {
  const [items, setItems] = useState<AsanaTask[]>(asanaTasks);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due-today'>('all');

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(t => t.id === id ? { ...t, flagged: !t.flagged } : t));

  const filtered = items.filter(t => {
    if (filter === 'overdue') return t.status === 'overdue';
    if (filter === 'due-today') return t.status === 'due-today';
    return true;
  });

  const overdueCount = items.filter(t => t.status === 'overdue').length;

  return (
    <div className="card flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="section-header mb-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)', color: 'var(--gold-light)' }}
            >
              A
            </div>
            <span className="section-title">Asana Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            {overdueCount > 0 && <span className="badge-danger">{overdueCount} Overdue</span>}
            <button
              style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '4px 8px', color: 'var(--gold-light)', fontSize: 11, cursor: 'pointer' }}
            >
              <ExternalLink size={11} />
            </button>
          </div>
        </div>

        <div className="flex gap-1">
          {(['all', 'overdue', 'due-today'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(201,160,68,0.2)' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(201,160,68,0.5)' : 'var(--border-subtle)'}`,
                borderRadius: 6,
                padding: '3px 10px',
                color: filter === f ? 'var(--gold-light)' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f === 'due-today' ? 'Due Today' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
        {filtered.map((task, idx) => {
          const sc = statusConfig[task.status];
          return (
            <div
              key={task.id}
              style={{
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: task.flagged ? 'rgba(201,160,68,0.04)' : 'transparent',
                transition: 'all 0.2s',
              }}
              className="px-4 py-3 hover:bg-black/[0.04]"
            >
              <div className="flex items-start gap-2.5">
                {/* Priority indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: priorityColors[task.priority], boxShadow: `0 0 6px ${priorityColors[task.priority]}60` }}
                  title={task.priority}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>
                      {task.title}
                    </p>
                    <button onClick={() => toggleFlag(task.id)} className="flag-btn flex-shrink-0">
                      <Flag size={11} fill={task.flagged ? 'var(--gold-light)' : 'none'} style={{ color: task.flagged ? 'var(--gold-light)' : 'var(--text-faint)' }} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: `1px solid ${sc.color}40`,
                      }}
                    >
                      {sc.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{task.project}</span>
                    <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>·</span>
                    <Clock size={9} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{task.dueDate}</span>
                  </div>

                  {/* Subtask progress */}
                  {task.subtasks && task.subtasks > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          Subtasks: {task.completedSubtasks}/{task.subtasks}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          {Math.round(((task.completedSubtasks || 0) / task.subtasks) * 100)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${((task.completedSubtasks || 0) / task.subtasks) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(201,160,68,0.15)' }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{items.length} tasks assigned</span>
        <button style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
          Open Asana →
        </button>
      </div>
    </div>
  );
}
