'use client';

import { useState } from 'react';
import { Mail, AlertTriangle, ChevronDown, ChevronUp, Clock, Zap, FileText } from 'lucide-react';
import { dailyBriefing } from '@/lib/data';

const sourceColors: Record<string, string> = {
  asana: '#4a9ed6',
  hubspot: '#e09a44',
  email: '#9b59b6',
  calendar: '#4caf82',
  linkedin: '#0a66c2',
  personal: '#c9a044',
};

const priorityColors = { critical: '#e05252', high: '#e09a44', medium: '#c9a044', low: '#4caf82' };

export default function DailyBriefing() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(42,42,42,0.95) 100%)',
        border: '1px solid rgba(201,160,68,0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Briefing header */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(201,160,68,0.15) 0%, rgba(201,160,68,0.05) 100%)',
          borderBottom: '1px solid rgba(201,160,68,0.2)',
          padding: '14px 16px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ background: 'linear-gradient(135deg, #c9a044, #d4af60)' }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
          >
            <Mail size={14} className="text-[#2a2a2a]" />
          </div>
          <div>
            <div className="section-title">Daily Briefing</div>
            <div style={{ color: '#888', fontSize: '11px' }}>
              Auto-generated · {dailyBriefing.generatedAt} · {dailyBriefing.date}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            style={{
              background: 'rgba(76,175,130,0.12)',
              border: '1px solid rgba(76,175,130,0.3)',
              borderRadius: 20,
              padding: '3px 10px',
              color: '#4caf82',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            ✓ DELIVERED 4:45 AM
          </div>
          {expanded ? <ChevronUp size={14} style={{ color: '#c9a044' }} /> : <ChevronDown size={14} style={{ color: '#c9a044' }} />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 slide-in">
          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Key Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={12} style={{ color: '#c9a044' }} />
                <span style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Key Insights for Today
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {dailyBriefing.keyInsights.map((insight, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: '2px solid #c9a044',
                      borderRadius: '0 8px 8px 0',
                      padding: '8px 10px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ color: '#c0c0c0', fontSize: '12px', lineHeight: 1.4 }}>{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue tasks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={12} style={{ color: '#e05252' }} />
                <span style={{ color: '#e05252', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Overdue Across Platforms
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {dailyBriefing.overdueTasks.map((task, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(224,82,82,0.06)',
                      border: '1px solid rgba(224,82,82,0.2)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-white font-bold"
                      style={{ background: sourceColors[task.source], fontSize: '8px' }}
                    >
                      {task.source.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#d0d0d0', fontSize: '12px', fontWeight: 500 }} className="truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={9} style={{ color: '#e05252' }} />
                        <span style={{ color: '#e05252', fontSize: '10px', fontWeight: 600 }}>
                          {task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        background: `${priorityColors[task.priority]}20`,
                        color: priorityColors[task.priority],
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: 4,
                        flexShrink: 0,
                        border: `1px solid ${priorityColors[task.priority]}40`,
                      }}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weather & schedule note */}
          <div
            style={{
              marginTop: '12px',
              background: 'rgba(201,160,68,0.06)',
              border: '1px solid rgba(201,160,68,0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <FileText size={13} style={{ color: '#c9a044', flexShrink: 0 }} />
            <p style={{ color: '#c0a060', fontSize: '12px', lineHeight: 1.4 }}>
              <strong>Today&apos;s outlook:</strong> {dailyBriefing.weatherCondition}, {dailyBriefing.temperature}. 
              You have <strong>4 meetings</strong>, <strong>2 critical tasks</strong> due today, and <strong>3 LinkedIn messages</strong> awaiting response.
              Recommend blocking 30 min before the 10:30 AM board call to finalize deck.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
