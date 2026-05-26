'use client';

import { useState } from 'react';
import { Flag, ExternalLink, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { hubspotTasks, type HubSpotTask } from '@/lib/data';

const typeConfig = {
  'follow-up': { color: '#c9a044', label: 'Follow-up', emoji: '🔄' },
  call: { color: '#4a9ed6', label: 'Call', emoji: '📞' },
  email: { color: '#9b59b6', label: 'Email', emoji: '✉' },
  demo: { color: '#4caf82', label: 'Demo', emoji: '🖥' },
  proposal: { color: '#e09a44', label: 'Proposal', emoji: '📋' },
};


export default function HubSpotPanel() {
  const [items, setItems] = useState<HubSpotTask[]>(hubspotTasks);

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(t => t.id === id ? { ...t, flagged: !t.flagged } : t));


  return (
    <div className="card flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="section-header mb-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}
            >
              <TrendingUp size={13} style={{ color: '#c9a044' }} />
            </div>
            <span className="section-title">HubSpot Tasks</span>
          </div>
          <button
            style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '4px 8px', color: '#c9a044', fontSize: 11, cursor: 'pointer' }}
          >
            <ExternalLink size={11} />
          </button>
        </div>

        {/* Pipeline summary */}
        <div
          style={{
            background: 'rgba(201,160,68,0.08)',
            border: '1px solid rgba(201,160,68,0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <DollarSign size={14} style={{ color: '#c9a044' }} />
          <div>
            <div style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700 }}>Active Pipeline</div>
            <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700 }}>$3,025,000</div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              background: 'rgba(76,175,130,0.15)',
              border: '1px solid rgba(76,175,130,0.3)',
              borderRadius: 6,
              padding: '2px 8px',
              color: '#4caf82',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {items.length} tasks
          </div>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
        {items.map((task, idx) => {
          const tc = typeConfig[task.type];
          const isOverdue = task.dueDate.includes('ago');

          return (
            <div
              key={task.id}
              style={{
                borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                background: task.flagged ? 'rgba(201,160,68,0.04)' : 'transparent',
                transition: 'all 0.2s',
              }}
              className="px-4 py-3 hover:bg-white/5"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">{tc.emoji}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>
                      {task.title}
                    </p>
                    <button onClick={() => toggleFlag(task.id)} className="flag-btn flex-shrink-0">
                      <Flag size={11} fill={task.flagged ? '#c9a044' : 'none'} style={{ color: task.flagged ? '#c9a044' : '#555' }} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span style={{ color: '#bbb', fontSize: '11px', fontWeight: 500 }}>{task.contact}</span>
                    <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                    <span style={{ color: '#888', fontSize: '11px' }}>{task.company}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      style={{
                        background: `${tc.color}20`,
                        color: tc.color,
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: `1px solid ${tc.color}40`,
                      }}
                    >
                      {tc.label}
                    </span>

                    {task.stage && (
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: '#999',
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {task.stage}
                      </span>
                    )}

                    {task.dealValue && (
                      <span style={{ color: '#4caf82', fontSize: '11px', fontWeight: 700 }}>
                        {task.dealValue}
                      </span>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <Clock size={9} style={{ color: isOverdue ? '#e05252' : '#666' }} />
                      <span style={{ color: isOverdue ? '#e05252' : '#666', fontSize: '10px', fontWeight: isOverdue ? 600 : 400 }}>
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
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
        <span style={{ color: '#666', fontSize: '11px' }}>Updated 5 min ago</span>
        <button style={{ color: '#c9a044', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
          Open HubSpot →
        </button>
      </div>
    </div>
  );
}
