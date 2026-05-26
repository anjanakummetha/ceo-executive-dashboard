'use client';

import { useState } from 'react';
import { Sparkles, Flame, AlertTriangle, CheckCircle2, Clock, ChevronRight, TrendingUp, Users, DollarSign, Shield, Zap, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { aiPriorityItems, riskItems, crackItems, anxietyReducers, dailyBriefing, type AIPriorityItem } from '@/lib/data';

const sourceColors: Record<string, string> = {
  asana: '#4a9ed6', hubspot: '#e09a44', email: '#9b59b6',
  calendar: '#4caf82', linkedin: '#0a66c2', personal: '#c9a044',
};

const sentimentConfig = {
  critical: { color: '#e05252', bg: 'rgba(224,82,82,0.15)', label: 'CRITICAL', glow: '0 0 16px rgba(224,82,82,0.25)' },
  negative: { color: '#e09a44', bg: 'rgba(224,154,68,0.15)', label: 'AT RISK', glow: '0 0 16px rgba(224,154,68,0.15)' },
  neutral:  { color: '#c9a044', bg: 'rgba(201,160,68,0.12)', label: 'MONITOR', glow: 'none' },
  positive: { color: '#4caf82', bg: 'rgba(76,175,130,0.12)', label: 'OPPORTUNITY', glow: 'none' },
};

const riskCategoryIcon: Record<string, React.ElementType> = {
  revenue: DollarSign, relationship: Users, deadline: Clock,
  team: Users, operational: AlertTriangle, health: Zap,
};

const anxietyIcon = { clear: CheckCircle2, warning: AlertTriangle, issue: Flame };
const anxietyColor = { clear: '#4caf82', warning: '#e09a44', issue: '#e05252' };

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: '#666', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: 70, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
        <div style={{ width: `${value * 10}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ color, fontSize: '10px', fontWeight: 700, width: 18, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function PriorityCard({ item, rank }: { item: AIPriorityItem; rank: number }) {
  const [expanded, setExpanded] = useState(rank <= 2);
  const [done, setDone] = useState(item.completed);
  const sc = sentimentConfig[item.sentiment];

  return (
    <div
      style={{
        background: done ? 'rgba(76,175,130,0.05)' : sc.bg,
        border: `1px solid ${done ? 'rgba(76,175,130,0.2)' : sc.color + '40'}`,
        borderLeft: `4px solid ${done ? '#4caf82' : sc.color}`,
        borderRadius: '0 12px 12px 0',
        boxShadow: done ? 'none' : sc.glow,
        opacity: done ? 0.55 : 1,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: done ? '#4caf82' : sc.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 900,
            color: '#1a1a1a',
            flexShrink: 0,
          }}
        >
          {done ? '✓' : rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p style={{
              color: done ? '#666' : '#f0f0f0',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.35,
              textDecoration: done ? 'line-through' : 'none',
            }}>
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!done && (
                <span style={{ background: sc.bg, color: sc.color, fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: 4, border: `1px solid ${sc.color}50`, letterSpacing: '0.5px' }}>
                  {sc.label}
                </span>
              )}
              <span style={{ background: 'rgba(255,255,255,0.08)', color: '#888', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                {item.compositeScore}
              </span>
              {expanded ? <ChevronUp size={12} style={{ color: '#666' }} /> : <ChevronDown size={12} style={{ color: '#666' }} />}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: sourceColors[item.source] }} />
            <span style={{ color: '#777', fontSize: '10px' }}>{item.sourceLabel}</span>
            <span style={{ color: '#444' }}>·</span>
            <Clock size={9} style={{ color: '#666' }} />
            <span style={{ color: '#666', fontSize: '10px', fontWeight: 600 }}>{item.timeEstimate}</span>
            {item.fireProbability >= 50 && !done && (
              <>
                <span style={{ color: '#444' }}>·</span>
                <Flame size={9} style={{ color: '#e05252' }} />
                <span style={{ color: '#e05252', fontSize: '10px', fontWeight: 700 }}>{item.fireProbability}% fire risk</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setDone(!done); }}
          style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}
        >
          <CheckCircle2 size={15} fill={done ? '#4caf82' : 'none'} style={{ color: done ? '#4caf82' : '#444' }} />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && !done && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px 14px 56px' }} className="slide-in">
          {/* Why */}
          <div className="mb-3">
            <p style={{ color: '#999', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Why this matters</p>
            <p style={{ color: '#c0bcd0', fontSize: '12px', lineHeight: 1.6 }}>{item.why}</p>
          </div>

          {/* Action */}
          <div
            style={{
              background: 'rgba(201,160,68,0.08)',
              border: '1px solid rgba(201,160,68,0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <ChevronRight size={13} style={{ color: '#c9a044', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Recommended Action</p>
              <p style={{ color: '#d4c080', fontSize: '12px', lineHeight: 1.5 }}>{item.action}</p>
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-1.5">
            <ScoreBar label="Urgency" value={item.scores.urgency} color={sc.color} />
            <ScoreBar label="Strategic" value={item.scores.strategic} color="#9b59b6" />
            <ScoreBar label="Revenue" value={item.scores.revenue} color="#4caf82" />
            <ScoreBar label="Relationship" value={item.scores.relationship} color="#4a9ed6" />
            <ScoreBar label="Deadline risk" value={item.scores.deadlineRisk} color="#e09a44" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TodayTab() {
  const [briefExpanded, setBriefExpanded] = useState(true);
  const [cracksExpanded, setCracksExpanded] = useState(true);

  const completedCount = aiPriorityItems.filter(i => i.completed).length;
  const clearCount = anxietyReducers.filter(a => a.status === 'clear').length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

      {/* ── Left 2 columns ── */}
      <div className="xl:col-span-2 space-y-5">

        {/* AI Conversational Morning Brief */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(18,18,28,0.98) 0%, rgba(32,28,48,0.98) 100%)',
            border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 4px 30px rgba(139,92,246,0.12)',
          }}
        >
          {/* Header */}
          <div
            style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.06) 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '14px 18px', cursor: 'pointer' }}
            onClick={() => setBriefExpanded(!briefExpanded)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div style={{ color: '#a78bfa', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>AI Chief of Staff</div>
                <div style={{ color: '#e8e0ff', fontSize: '14px', fontWeight: 700 }}>Morning Brief — {dailyBriefing.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div style={{ background: 'rgba(76,175,130,0.12)', border: '1px solid rgba(76,175,130,0.3)', borderRadius: 20, padding: '3px 10px', color: '#4caf82', fontSize: '10px', fontWeight: 700 }}>
                ✓ Delivered {dailyBriefing.generatedAt}
              </div>
              {briefExpanded ? <ChevronUp size={14} style={{ color: '#8b5cf6' }} /> : <ChevronDown size={14} style={{ color: '#8b5cf6' }} />}
            </div>
          </div>

          {briefExpanded && (
            <div style={{ padding: '18px 20px' }} className="slide-in">
              <p style={{ color: '#d8d0f4', fontSize: '14px', lineHeight: 1.8, fontStyle: 'italic', borderLeft: '3px solid rgba(139,92,246,0.5)', paddingLeft: 14 }}>
                {dailyBriefing.conversationalBrief}
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {dailyBriefing.keyInsights.map((insight, i) => (
                  <div key={i} style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', borderLeft: '2px solid #8b5cf6', borderRadius: '0 7px 7px 0', padding: '7px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#8b5cf6', fontSize: '10px', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                    <p style={{ color: '#c0b8e0', fontSize: '11px', lineHeight: 1.5 }}>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Prioritization Engine */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #c9a044, #d4af60)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} className="text-[#2a2a2a]" />
              </div>
              <div>
                <div style={{ color: '#c9a044', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>AI Prioritization Engine</div>
                <div style={{ color: '#888', fontSize: '11px' }}>Scored by urgency, revenue impact, relationship risk & deadline probability</div>
              </div>
            </div>
            <span style={{ background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.3)', borderRadius: 20, padding: '3px 10px', color: '#c9a044', fontSize: '10px', fontWeight: 700 }}>
              {aiPriorityItems.length - completedCount} Active
            </span>
          </div>
          <div className="space-y-3">
            {aiPriorityItems.map((item, idx) => (
              <PriorityCard key={item.id} item={item} rank={idx + 1} />
            ))}
          </div>
        </div>

        {/* What Fell Through the Cracks */}
        <div className="card">
          <div
            style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
            onClick={() => setCracksExpanded(!cracksExpanded)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(224,82,82,0.15)', border: '1px solid rgba(224,82,82,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={13} style={{ color: '#e05252' }} />
              </div>
              <div>
                <div style={{ color: '#e05252', fontSize: '10px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>What Fell Through the Cracks</div>
                <div style={{ color: '#888', fontSize: '11px' }}>{crackItems.length} items AI identified as neglected or forgotten</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-danger">{crackItems.filter(c => c.urgency === 'high').length} Urgent</span>
              {cracksExpanded ? <ChevronUp size={13} style={{ color: '#666' }} /> : <ChevronDown size={13} style={{ color: '#666' }} />}
            </div>
          </div>

          {cracksExpanded && (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {crackItems.map((item) => {
                const urgencyColor = item.urgency === 'high' ? '#e05252' : item.urgency === 'medium' ? '#e09a44' : '#888';
                const catEmoji: Record<string, string> = { email: '✉', task: '✓', person: '👤', opportunity: '💰', crm: '📊', 'follow-up': '🔄' };
                return (
                  <div key={item.id} className="px-4 py-3 hover:bg-white/5" style={{ transition: 'all 0.2s' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-base flex-shrink-0 mt-0.5">{catEmoji[item.category]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 500 }}>{item.title}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span style={{ color: urgencyColor, fontSize: '10px', fontWeight: 700, background: `${urgencyColor}18`, padding: '1px 6px', borderRadius: 4, border: `1px solid ${urgencyColor}35` }}>
                              {item.urgency.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={9} style={{ color: urgencyColor }} />
                          <span style={{ color: urgencyColor, fontSize: '10px', fontWeight: 600 }}>{item.daysSince} days since last action</span>
                          <span style={{ color: '#444' }}>·</span>
                          <span style={{ color: '#666', fontSize: '10px' }}>{item.source}</span>
                        </div>
                        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 6, padding: '5px 8px', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <Sparkles size={9} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2 }} />
                          <p style={{ color: '#b0a0d8', fontSize: '11px', lineHeight: 1.4 }}>{item.aiNote}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="space-y-5">

        {/* Executive Status — Anxiety Reducers */}
        <div className="card">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(201,160,68,0.18)' }}>
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: '#c9a044' }} />
              <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Status Check</span>
            </div>
            <p style={{ color: '#888', fontSize: '11px', marginTop: 2 }}>{clearCount}/{anxietyReducers.length} items all-clear</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {anxietyReducers.map((item) => {
              const StatusIcon = anxietyIcon[item.status];
              const color = anxietyColor[item.status];
              return (
                <div key={item.id} style={{ padding: '10px 14px', background: item.status === 'issue' ? 'rgba(224,82,82,0.04)' : item.status === 'warning' ? 'rgba(224,154,68,0.04)' : 'transparent' }}>
                  <div className="flex items-start gap-2.5">
                    <StatusIcon size={14} style={{ color, flexShrink: 0, marginTop: 1 }} fill={item.status === 'clear' ? color : 'none'} />
                    <div>
                      <p style={{ color: '#d0d0d0', fontSize: '12px', fontWeight: 600 }}>{item.label}</p>
                      <p style={{ color: '#777', fontSize: '11px', lineHeight: 1.4, marginTop: 1 }}>{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Predictive Risk Radar */}
        <div className="card">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(201,160,68,0.18)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: '#e09a44' }} />
              <span style={{ color: '#e09a44', fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Predictive Risk Radar</span>
            </div>
            <p style={{ color: '#888', fontSize: '11px', marginTop: 2 }}>{riskItems.filter(r => r.impact === 'critical').length} critical risks detected</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {riskItems.map((risk) => {
              const impactColor = risk.impact === 'critical' ? '#e05252' : risk.impact === 'high' ? '#e09a44' : '#c9a044';
              const RiskIcon = riskCategoryIcon[risk.category] || AlertTriangle;
              const barPct = risk.probability;
              return (
                <div key={risk.id} style={{ padding: '11px 14px', transition: 'all 0.2s' }} className="hover:bg-white/5">
                  <div className="flex items-start gap-2.5">
                    <RiskIcon size={13} style={{ color: impactColor, flexShrink: 0, marginTop: 1 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p style={{ color: '#d0d0d0', fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>{risk.title}</p>
                        <span style={{ color: impactColor, fontSize: '10px', fontWeight: 700, background: `${impactColor}18`, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
                          {risk.impact.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ color: '#888', fontSize: '11px', lineHeight: 1.4, marginBottom: 5 }}>{risk.description}</p>
                      {/* Probability bar */}
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                          <div style={{ width: `${barPct}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${impactColor}60, ${impactColor})`, transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={{ color: impactColor, fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>{barPct}%</span>
                      </div>
                      <p style={{ color: '#666', fontSize: '10px', marginTop: 4, fontStyle: 'italic' }}>→ {risk.recommendation.slice(0, 80)}{risk.recommendation.length > 80 ? '…' : ''}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue tasks quick view */}
        <div className="card">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(224,82,82,0.2)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} style={{ color: '#e05252' }} />
              <span style={{ color: '#e05252', fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Overdue Across Platforms</span>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {dailyBriefing.overdueTasks.map((task, i) => {
              const srcColor = sourceColors[task.source] || '#888';
              return (
                <div key={i} style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }} className="hover:bg-white/5">
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: srcColor + '20', border: `1px solid ${srcColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: srcColor, flexShrink: 0 }}>
                    {task.source.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: '#d0d0d0', fontSize: '11px', fontWeight: 500 }} className="truncate">{task.title}</p>
                    <span style={{ color: '#e05252', fontSize: '9px', fontWeight: 700 }}>
                      {task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
