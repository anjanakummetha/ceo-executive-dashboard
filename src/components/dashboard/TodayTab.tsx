'use client';

import { useState } from 'react';
import { Mail, Zap, AlertTriangle, CheckCircle2, Clock, ChevronRight, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { aiPriorityItems, dailyBriefing, meetings, type AIPriorityItem } from '@/lib/data';

const sourceColors: Record<string, string> = {
 asana: '#4a9ed6', hubspot: '#e09a44', email: '#c9a044',
 calendar: '#4caf82', linkedin: '#4a9ed6', personal: '#c9a044',
};

const sentimentConfig = {
 critical: { color: '#e05252', bg: 'rgba(224,82,82,0.1)', label: 'CRITICAL' },
 negative: { color: '#e09a44', bg: 'rgba(224,154,68,0.1)', label: 'AT RISK' },
 neutral: { color: '#c9a044', bg: 'rgba(201,160,68,0.1)', label: 'MONITOR' },
 positive: { color: '#4caf82', bg: 'rgba(76,175,130,0.1)', label: 'OPPORTUNITY' },
};

function PriorityCard({ item, rank }: { item: AIPriorityItem; rank: number }) {
 const [expanded, setExpanded] = useState(rank <= 2);
 const [done, setDone] = useState(item.completed);
 const sc = sentimentConfig[item.sentiment];

 return (
  <div
   style={{
    background: done ? 'rgba(76,175,130,0.04)' : '#333333',
    border: `1px solid ${done ? 'rgba(76,175,130,0.2)' : sc.color + '30'}`,
    borderLeft: `3px solid ${done ? '#4caf82' : sc.color}`,
    borderRadius: '0 10px 10px 0',
    opacity: done ? 0.55 : 1,
    transition: 'all 0.3s ease',
   }}
  >
   <div
    className="flex items-start gap-3 p-4 cursor-pointer"
    onClick={() => setExpanded(!expanded)}
   >
    <div style={{ width: 26, height: 26, borderRadius: '50%', background: done ? '#4caf82' : sc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: '#1a1a1a', flexShrink: 0 }}>
     {done ? '✓' : rank}
    </div>

    <div className="flex-1 min-w-0">
     <div className="flex items-start justify-between gap-2">
      <p style={{ color: done ? '#666' : '#f0f0f0', fontSize: '13px', fontWeight: 600, lineHeight: 1.35, textDecoration: done ? 'line-through' : 'none' }}>
       {item.title}
      </p>
      <div className="flex items-center gap-1.5 flex-shrink-0">
       {!done && (
        <span style={{ background: sc.bg, color: sc.color, fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: 4, border: `1px solid ${sc.color}40`, letterSpacing: '0.5px' }}>
         {sc.label}
        </span>
       )}
       <span style={{ background: 'rgba(201,160,68,0.15)', color: '#c9a044', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 10, border: '1px solid rgba(201,160,68,0.25)' }}>
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

    <button onClick={(e) => { e.stopPropagation(); setDone(!done); }} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>
     <CheckCircle2 size={15} fill={done ? '#4caf82' : 'none'} style={{ color: done ? '#4caf82' : '#444' }} />
    </button>
   </div>

   {expanded && !done && (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px 14px 52px' }} className="slide-in">
     <div className="mb-3">
      <p style={{ color: '#888', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Why this matters</p>
      <p style={{ color: '#b8b8b8', fontSize: '12px', lineHeight: 1.6 }}>{item.why}</p>
     </div>
     <div style={{ background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.18)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <ChevronRight size={13} style={{ color: '#c9a044', flexShrink: 0, marginTop: 1 }} />
      <div>
       <p style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Recommended Action</p>
       <p style={{ color: '#d4c080', fontSize: '12px', lineHeight: 1.5 }}>{item.action}</p>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

type BriefTab = 'insights' | 'overdue' | 'people';

export default function TodayTab() {
 const [briefTab, setBriefTab] = useState<BriefTab>('insights');
 const completedCount = aiPriorityItems.filter(i => i.completed).length;

 // Collect all unique meeting attendees for Today's People
 const todayPeople = meetings.flatMap(m =>
  m.attendees.map(a => ({ ...a, meetingTitle: m.title, meetingTime: m.time }))
 );

 return (
  <div className="space-y-5 max-w-[1400px] mx-auto">

   {/* ── Daily Briefing ── */}
   <div style={{ background: '#2e2e2e', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 14, overflow: 'hidden' }}>
    {/* Header */}
    <div style={{ background: 'linear-gradient(90deg, #2a2a2a 0%, #303030 100%)', borderBottom: '1px solid rgba(201,160,68,0.18)', padding: '14px 20px' }}>
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
       <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mail size={16} style={{ color: '#c9a044' }} />
       </div>
       <div>
        <div style={{ color: '#c9a044', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Daily Briefing</div>
        <div style={{ color: '#888', fontSize: '11px', marginTop: 1 }}>Auto-generated · {dailyBriefing.generatedAt} · {dailyBriefing.date}</div>
       </div>
      </div>
      <div style={{ background: 'rgba(76,175,130,0.1)', border: '1px solid rgba(76,175,130,0.3)', borderRadius: 20, padding: '4px 12px', color: '#4caf82', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>
       ✓ DELIVERED {dailyBriefing.generatedAt}
      </div>
     </div>
    </div>

    {/* Tabs */}
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px', display: 'flex', gap: 0 }}>
     {([
      { key: 'insights' as const, label: 'Key Insights', count: dailyBriefing.keyInsights.length },
      { key: 'overdue' as const, label: 'Overdue Tasks', count: dailyBriefing.overdueTasks.length },
      { key: 'people' as const, label: "Today's People", count: todayPeople.length },
     ]).map(({ key, label, count }) => (
      <button
       key={key}
       onClick={() => setBriefTab(key)}
       style={{ padding: '10px 16px', fontSize: '12px', fontWeight: briefTab === key ? 700 : 500, color: briefTab === key ? '#c9a044' : '#666', background: 'none', border: 'none', borderBottom: briefTab === key ? '2px solid #c9a044' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
      >
       {label}
       <span style={{ background: briefTab === key ? 'rgba(201,160,68,0.2)' : 'rgba(255,255,255,0.08)', color: briefTab === key ? '#c9a044' : '#555', borderRadius: 10, padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
        {count}
       </span>
      </button>
     ))}
    </div>

    {/* Tab Content */}
    <div style={{ padding: '18px 20px' }}>
     {briefTab === 'insights' && (
      <div className="slide-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {dailyBriefing.keyInsights.map((insight, i) => (
         <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,160,68,0.12)', borderLeft: '2px solid rgba(201,160,68,0.5)', borderRadius: '0 8px 8px 0', padding: '9px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 800, flexShrink: 0, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
          <p style={{ color: '#c8c8c8', fontSize: '12px', lineHeight: 1.55 }}>{insight}</p>
         </div>
        ))}
       </div>
      </div>
     )}

     {briefTab === 'overdue' && (
      <div className="slide-in space-y-2">
       {dailyBriefing.overdueTasks.map((task, i) => {
        const srcColor = sourceColors[task.source] || '#888';
        const priorityColor = task.priority === 'critical' ? '#e05252' : task.priority === 'high' ? '#e09a44' : '#c9a044';
        return (
         <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: srcColor + '18', border: `1px solid ${srcColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: srcColor, flexShrink: 0 }}>
           {task.source.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
           <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 500 }}>{task.title}</p>
           <div className="flex items-center gap-2 mt-0.5">
            <AlertTriangle size={9} style={{ color: priorityColor }} />
            <span style={{ color: priorityColor, fontSize: '10px', fontWeight: 700 }}>{task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue</span>
            <span style={{ color: '#444' }}>·</span>
            <span style={{ color: '#666', fontSize: '10px', textTransform: 'capitalize' }}>{task.source}</span>
           </div>
          </div>
          <span style={{ background: priorityColor + '18', color: priorityColor, border: `1px solid ${priorityColor}35`, borderRadius: 6, padding: '2px 8px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px', flexShrink: 0 }}>
           {task.priority.toUpperCase()}
          </span>
         </div>
        );
       })}
      </div>
     )}

     {briefTab === 'people' && (
      <div className="slide-in">
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {todayPeople.map((person, i) => (
         <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '13px 14px' }}>
          <div className="flex items-center gap-3 mb-2">
           <div style={{ width: 38, height: 38, borderRadius: '50%', background: person.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>
            {person.initials}
           </div>
           <div className="flex-1 min-w-0">
            <p style={{ color: '#f0f0f0', fontSize: '13px', fontWeight: 700 }}>{person.name}</p>
            <p style={{ color: '#888', fontSize: '11px' }}>{person.role}</p>
            <p style={{ color: '#666', fontSize: '10px' }}>{person.company}</p>
           </div>
          </div>
          <div style={{ background: 'rgba(201,160,68,0.08)', border: '1px solid rgba(201,160,68,0.18)', borderRadius: 6, padding: '4px 8px', marginBottom: person.bio ? 8 : 0 }}>
           <span style={{ color: '#c9a044', fontSize: '10px', fontWeight: 600 }}>{person.meetingTime} · {person.meetingTitle}</span>
          </div>
          {person.bio && (
           <p style={{ color: '#999', fontSize: '11px', lineHeight: 1.5 }}>{person.bio}</p>
          )}
         </div>
        ))}
       </div>
      </div>
     )}
    </div>

    {/* Day Summary Bar */}
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
     <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <span style={{ fontSize: '9px' }}>📋</span>
     </div>
     <p style={{ color: '#aaa', fontSize: '12px', lineHeight: 1.5 }}>
      <span style={{ color: '#ddd', fontWeight: 600 }}>Day summary:</span>{' '}
      You have <span style={{ color: '#c9a044', fontWeight: 700 }}>4 meetings</span>, <span style={{ color: '#e05252', fontWeight: 700 }}>2 critical tasks</span> due today, and <span style={{ color: '#4a9ed6', fontWeight: 700 }}>3 LinkedIn messages</span> awaiting response. Recommend blocking 30 min before the 10:30 AM board call to finalize the deck.
     </p>
    </div>
   </div>

   {/* ── AI Prioritization Engine ── */}
   <div style={{ background: '#2e2e2e', border: '1px solid rgba(201,160,68,0.2)', borderRadius: 14, overflow: 'hidden' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
     <div className="flex items-center gap-3">
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #c9a044, #d4af60)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       <Zap size={15} className="text-[#2a2a2a]" />
      </div>
      <div>
       <div style={{ color: '#c9a044', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>AI Prioritization Engine</div>
       <div style={{ color: '#777', fontSize: '11px' }}>Scored by urgency, revenue impact, relationship risk & deadline probability</div>
      </div>
     </div>
     <div className="flex items-center gap-3">
      <span style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 20, padding: '3px 12px', color: '#c9a044', fontSize: '10px', fontWeight: 700 }}>
       {aiPriorityItems.length - completedCount} Active
      </span>
      <div className="flex items-center gap-2">
       {(['critical','negative','neutral','positive'] as const).map(s => (
        <span key={s} style={{ fontSize: '10px', color: sentimentConfig[s].color, background: sentimentConfig[s].bg, border: `1px solid ${sentimentConfig[s].color}30`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
         {sentimentConfig[s].label}
        </span>
       ))}
      </div>
     </div>
    </div>
    <div style={{ padding: '16px 20px' }}>
     <div className="space-y-3">
      {aiPriorityItems.map((item, idx) => (
       <PriorityCard key={item.id} item={item} rank={idx + 1} />
      ))}
     </div>
    </div>
   </div>

   {/* ── Overdue Across Platforms ── */}
   <div style={{ background: '#2e2e2e', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 14, overflow: 'hidden' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(224,82,82,0.12)', display: 'flex', alignItems: 'center', gap: 3 }}>
     <AlertTriangle size={14} style={{ color: '#e05252' }} />
     <span style={{ color: '#e05252', fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginLeft: 6 }}>Overdue Across Platforms</span>
     <span style={{ marginLeft: 8, background: 'rgba(224,82,82,0.12)', color: '#e05252', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 10, padding: '1px 8px', fontSize: '10px', fontWeight: 700 }}>
      {dailyBriefing.overdueTasks.length}
     </span>
    </div>
    <div style={{ padding: '8px 0' }}>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      {dailyBriefing.overdueTasks.map((task, i) => {
       const srcColor = sourceColors[task.source] || '#888';
       const priorityColor = task.priority === 'critical' ? '#e05252' : task.priority === 'high' ? '#e09a44' : '#c9a044';
       return (
        <div key={i} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < dailyBriefing.overdueTasks.length - 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }} className="hover:bg-white/5 transition-all">
         <div style={{ width: 24, height: 24, borderRadius: 6, background: srcColor + '18', border: `1px solid ${srcColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: srcColor, flexShrink: 0 }}>
          {task.source.slice(0, 2).toUpperCase()}
         </div>
         <div className="flex-1 min-w-0">
          <p style={{ color: '#d0d0d0', fontSize: '12px', fontWeight: 500 }} className="truncate">{task.title}</p>
          <span style={{ color: '#e05252', fontSize: '10px', fontWeight: 600 }}>
           {task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue
          </span>
         </div>
         <span style={{ background: priorityColor + '18', color: priorityColor, border: `1px solid ${priorityColor}30`, borderRadius: 5, padding: '1px 7px', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>
          {task.priority.toUpperCase()}
         </span>
        </div>
       );
      })}
     </div>
    </div>
   </div>

  </div>
 );
}
