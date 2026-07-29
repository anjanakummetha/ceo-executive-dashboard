'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, Zap, AlertTriangle, CheckCircle2, Clock, ChevronRight, ChevronDown, ChevronUp, Flame, UserPlus, Lightbulb } from 'lucide-react';
import { aiPriorityItems, dailyBriefing, type AIPriorityItem, type AsanaTask, type DailyBriefing, type OverdueTask, type BriefSection } from '@/lib/data';
import { buildTodayPeopleFromMeetings, isInternalAttendee } from '@/lib/outlook/meeting-people';
import { useSync } from '@/components/dashboard/SyncProvider';
import { useAttendeeIntel } from '@/components/dashboard/AttendeeIntelProvider';
import { useRefreshSignal } from '@/components/dashboard/RefreshSignalProvider';
import LexiPanel from '@/components/dashboard/LexiPanel';
import WeekAheadPanel from '@/components/dashboard/WeekAheadPanel';
import ExecutiveSnapshot from '@/components/dashboard/ExecutiveSnapshot';
import type { TabId } from '@/components/dashboard/TabNav';

const sourceColors: Record<string, string> = {
 asana: 'var(--info)', email: 'var(--gold-light)',
 calendar: 'var(--success)', linkedin: 'var(--info)', personal: 'var(--gold-light)',
};

const sentimentConfig = {
 critical: { color: 'var(--danger)', bg: 'rgba(224,82,82,0.1)', label: 'CRITICAL' },
 negative: { color: 'var(--warning)', bg: 'rgba(224,154,68,0.1)', label: 'AT RISK' },
 neutral: { color: 'var(--gold-light)', bg: 'rgba(201,160,68,0.1)', label: 'MONITOR' },
 positive: { color: 'var(--success)', bg: 'rgba(76,175,130,0.1)', label: 'OPPORTUNITY' },
};

function PriorityCard({ item, rank }: { item: AIPriorityItem; rank: number }) {
 const [expanded, setExpanded] = useState(rank <= 2);
 const [done, setDone] = useState(item.completed);
 const sc = sentimentConfig[item.sentiment];

 return (
  <div
   style={{
    background: done ? 'rgba(76,175,130,0.04)' : 'var(--bg-card-alt)',
    border: `1px solid ${done ? 'rgba(76,175,130,0.2)' : sc.color + '30'}`,
    borderLeft: `3px solid ${done ? 'var(--success)' : sc.color}`,
    borderRadius: '0 10px 10px 0',
    opacity: done ? 0.55 : 1,
    transition: 'all 0.3s ease',
   }}
  >
   <div
    className="flex items-start gap-3 p-4 cursor-pointer"
    onClick={() => setExpanded(!expanded)}
   >
    <div style={{ width: 26, height: 26, borderRadius: '50%', background: done ? 'var(--success)' : sc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: '#ffffff', flexShrink: 0 }}>
     {done ? '✓' : rank}
    </div>

    <div className="flex-1 min-w-0">
     <div className="flex items-start justify-between gap-2">
      <p style={{ color: done ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '13px', fontWeight: 600, lineHeight: 1.35, textDecoration: done ? 'line-through' : 'none' }}>
       {item.title}
      </p>
      <div className="flex items-center gap-1.5 flex-shrink-0">
       {!done && (
        <span style={{ background: sc.bg, color: sc.color, fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: 4, border: `1px solid ${sc.color}40`, letterSpacing: '0.5px' }}>
         {sc.label}
        </span>
       )}
       <span style={{ background: 'rgba(201,160,68,0.15)', color: 'var(--gold-light)', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 10, border: '1px solid rgba(201,160,68,0.25)' }}>
        {item.compositeScore}
       </span>
       {expanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
      </div>
     </div>

     <div className="flex items-center gap-2 mt-1.5 flex-wrap">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: sourceColors[item.source] }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{item.sourceLabel}</span>
      <span style={{ color: 'var(--text-faint)' }}>·</span>
      <Clock size={9} style={{ color: 'var(--text-muted)' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 600 }}>{item.timeEstimate}</span>
      {item.fireProbability >= 50 && !done && (
       <>
        <span style={{ color: 'var(--text-faint)' }}>·</span>
        <Flame size={9} style={{ color: 'var(--danger)' }} />
        <span style={{ color: 'var(--danger)', fontSize: '10px', fontWeight: 700 }}>{item.fireProbability}% fire risk</span>
       </>
      )}
     </div>
    </div>

    <button onClick={(e) => { e.stopPropagation(); setDone(!done); }} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>
     <CheckCircle2 size={15} fill={done ? 'var(--success)' : 'none'} style={{ color: done ? 'var(--success)' : 'var(--text-faint)' }} />
    </button>
   </div>

   {expanded && !done && (
    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 16px 14px 52px' }} className="slide-in">
     <div className="mb-3">
      <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Why this matters</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>{item.why}</p>
     </div>
     <div style={{ background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.18)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <ChevronRight size={13} style={{ color: 'var(--gold-light)', flexShrink: 0, marginTop: 1 }} />
      <div>
       <p style={{ color: 'var(--gold-primary)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Recommended Action</p>
       <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>{item.action}</p>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

/** Split a narrative briefing into individual sentences (scannable bullets). */
function briefSentences(text: string): string[] {
  const clean = (text || '').trim();
  if (!clean) return [];
  const explicit = clean.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const source = explicit.length > 1 ? explicit.join(' ') : clean;
  return source.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
}

/** Bold the load-bearing tokens in a briefing sentence: times, money, %, weekdays, quotes. */
function emphasize(text: string) {
  const re = /(\d{1,2}:\d{2}\s?(?:AM|PM)|\$[\d][\d.,]*|\+?\d[\d.,]*%(?:\s?YoY)?|\b\d+\s?(?:days?|AM|PM)\b|"[^"]+"|\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b)/g;
  return text.split(re).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part}</strong>
      : <span key={i}>{part}</span>,
  );
}

/** Split a briefing into a short lead paragraph (the framing) + bullets (the specifics). */
function splitBriefLead(text: string): { lead: string; bullets: string[] } {
  const sentences = briefSentences(text);
  if (sentences.length === 0) return { lead: '', bullets: [] };
  // Short briefs read fine as a single paragraph — no bullets needed.
  if (sentences.length <= 2) return { lead: sentences.join(' '), bullets: [] };
  // Lead with the framing sentence(s); bullet the discrete items that follow.
  const leadCount = sentences[0].length < 70 ? 2 : 1;
  return { lead: sentences.slice(0, leadCount).join(' '), bullets: sentences.slice(leadCount) };
}

/** The morning summary, grouped under its own headings.
 *
 * Preferred over BriefBody: splitting prose by sentence count could only ever
 * produce a lead plus a flat list, never the sections Kory reads by. */
function BriefSections({ sections }: { sections: BriefSection[] }) {
  return (
    <div className="space-y-3.5">
      {sections.map((section) => (
        <div key={section.heading}>
          <p
            style={{
              color: 'var(--gold-primary)',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 6,
            }}
          >
            {section.heading}
          </p>
          <ul className="space-y-1.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {section.points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--gold-primary)',
                    flexShrink: 0,
                    marginTop: 7,
                    opacity: 0.75,
                  }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.6 }}>
                  {emphasize(point)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Renders a briefing as a lead paragraph plus scannable, emphasized bullets.
 *  Fallback for briefings generated before briefSections existed. */
function BriefBody({ text }: { text: string }) {
  const { lead, bullets } = splitBriefLead(text);
  if (!lead && bullets.length === 0) return null;
  return (
    <>
      {lead ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{emphasize(lead)}</p>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="space-y-2" style={{ listStyle: 'none', margin: lead ? '11px 0 0' : '0', padding: 0 }}>
          {bullets.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold-primary)', flexShrink: 0, marginTop: 7 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.6 }}>{emphasize(s)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

type BriefTab = 'insights' | 'overdue' | 'people';

function parseDaysOverdue(dueDate: string): number {
 const m = dueDate.match(/(\d+)\s+days?\s+ago/i);
 if (m) return parseInt(m[1], 10);
 if (/yesterday/i.test(dueDate)) return 1;
 return 1;
}

function asanaToOverdue(task: AsanaTask): OverdueTask {
 return {
  title: task.title,
  source: 'asana',
  daysOverdue: parseDaysOverdue(task.dueDate),
  priority: task.priority,
 };
}

export default function TodayTab({ onNavigate }: { onNavigate?: (tab: TabId) => void }) {
 const { meetings: calendarMeetings, tasks, loading: syncLoading } = useSync();
 const { people: intelPeople, loading: intelLoading } = useAttendeeIntel();
 const { nonce: refreshNonce } = useRefreshSignal();
 const lastNonceRef = useRef(refreshNonce);
 const [briefTab, setBriefTab] = useState<BriefTab>('insights');
 const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
 const [briefingMeta, setBriefingMeta] = useState<{ emailDraft?: { to: string; subject: string }; emailSent: boolean } | null>(null);
 const [priorities, setPriorities] = useState<AIPriorityItem[]>([]);
 const [aiLoading, setAiLoading] = useState(true);
 const completedCount = priorities.filter(i => i.completed).length;

 const asanaOverdue = tasks.filter((t) => t.status === 'overdue').map(asanaToOverdue);

 useEffect(() => {
  let cancelled = false;
  (async () => {
   setAiLoading(true);
   // A bump of the global refresh nonce forces briefing + priorities to
   // regenerate rather than serving the once-per-day cache.
   const force = refreshNonce !== lastNonceRef.current;
   lastNonceRef.current = refreshNonce;
   try {
    const [briefRes, priRes] = await Promise.all([
     fetch(force ? '/api/hermes/briefing?generate=1' : '/api/hermes/briefing'),
     fetch(force ? '/api/hermes/priorities?refresh=1' : '/api/hermes/priorities'),
    ]);
    if (cancelled) return;
    if (briefRes.ok) {
     const b = await briefRes.json();
     setBriefing(b.briefing ?? null);
     setBriefingMeta({ emailDraft: b.briefing?.emailDraft, emailSent: b.emailSent === true });
    }
    if (priRes.ok) {
     const p = await priRes.json();
     setPriorities(p.items?.length ? p.items : aiPriorityItems);
    } else {
     setPriorities(aiPriorityItems);
    }
   } catch {
    if (!cancelled) {
     setBriefing(null);
     setPriorities(aiPriorityItems);
    }
   } finally {
    if (!cancelled) setAiLoading(false);
   }
  })();
  return () => { cancelled = true; };
 }, [calendarMeetings, refreshNonce]);

 const activeBriefing = briefing ?? dailyBriefing;

 const overdueTasks =
  asanaOverdue.length > 0 ? asanaOverdue : activeBriefing.overdueTasks;

 const rawPeople =
  intelPeople.length > 0 ? intelPeople : buildTodayPeopleFromMeetings(calendarMeetings);
 // People Kory has to prepare for come first: outside guests before colleagues,
 // one-off meetings before standing ones. Colleagues carry no bio by design, so
 // leaving them interleaved buried the cards that actually matter.
 const displayPeople = [...rawPeople].sort((a, b) => {
  const rank = (p: typeof a) =>
   (isInternalAttendee({ name: p.name, email: p.email }) ? 2 : 0) + (p.recurring ? 1 : 0);
  return rank(a) - rank(b);
 });
 const peopleAiBusy = intelLoading && displayPeople.every((p) => !p.bio);
 const todayMeetingCount = calendarMeetings.filter(
  (m) => (m.scheduleKind ?? 'meeting') === 'meeting',
 ).length;

 return (
  <div className="space-y-5 max-w-[1400px] mx-auto">

   {/* ── Daily Briefing (top of the day) ── */}
   <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,245,238,0.5))', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, overflow: 'hidden' }}>
    {/* Header */}
    <div style={{ background: 'linear-gradient(90deg, var(--bg-nav) 0%, var(--bg-panel-accent) 100%)', borderBottom: '1px solid rgba(201,160,68,0.18)', padding: '14px 20px' }}>
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
       <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mail size={16} style={{ color: 'var(--gold-light)' }} />
       </div>
       <div>
        <div style={{ color: 'var(--gold-light)', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Daily Briefing</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 1 }}>Hermes · {activeBriefing.generatedAt} · {activeBriefing.date}</div>
       </div>
      </div>
      <div style={{ background: briefingMeta?.emailSent ? 'rgba(76,175,130,0.1)' : 'rgba(201,160,68,0.1)', border: `1px solid ${briefingMeta?.emailSent ? 'rgba(76,175,130,0.3)' : 'rgba(201,160,68,0.3)'}`, borderRadius: 20, padding: '4px 12px', color: briefingMeta?.emailSent ? 'var(--success)' : 'var(--gold-light)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>
       {briefingMeta?.emailSent ? `✓ DELIVERED ${activeBriefing.generatedAt}` : `DRAFT READY · ${activeBriefing.generatedAt}`}
      </div>
     </div>
    </div>

    {/* Tabs */}
    <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '0 20px', display: 'flex', gap: 0 }}>
     {([
      { key: 'insights' as const, label: 'Key Insights', count: activeBriefing.keyInsights.length },
      { key: 'overdue' as const, label: 'Overdue Tasks', count: overdueTasks.length },
      { key: 'people' as const, label: "Today's People", count: displayPeople.length },
     ]).map(({ key, label, count }) => (
      <button
       key={key}
       onClick={() => setBriefTab(key)}
       style={{ padding: '10px 16px', fontSize: '12px', fontWeight: briefTab === key ? 700 : 500, color: briefTab === key ? 'var(--gold-light)' : 'var(--text-muted)', background: 'none', border: 'none', borderBottom: briefTab === key ? '2px solid var(--gold-light)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
      >
       {label}
       <span style={{ background: briefTab === key ? 'rgba(201,160,68,0.2)' : 'var(--border-subtle)', color: briefTab === key ? 'var(--gold-light)' : 'var(--text-faint)', borderRadius: 10, padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
        {count}
       </span>
      </button>
     ))}
    </div>

    {/* Tab Content */}
    <div style={{ padding: '18px 20px' }}>
     {briefTab === 'insights' && (
      <div className="slide-in space-y-4">
       {activeBriefing.briefSections?.length ? (
        <div style={{ background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.18)', borderLeft: '3px solid var(--gold-primary)', borderRadius: '0 10px 10px 0', padding: '14px 16px' }}>
         <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Morning Summary</p>
         <BriefSections sections={activeBriefing.briefSections} />
        </div>
       ) : activeBriefing.conversationalBrief ? (
        <div style={{ background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.18)', borderLeft: '3px solid var(--gold-primary)', borderRadius: '0 10px 10px 0', padding: '14px 16px' }}>
         <p style={{ color: 'var(--gold-primary)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Morning Summary</p>
         <BriefBody text={activeBriefing.conversationalBrief} />
        </div>
       ) : null}
       {activeBriefing.keyInsights.length > 0 && (
        <div>
         <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Key Insights</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {activeBriefing.keyInsights.map((insight, i) => (
           <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderLeft: '2px solid var(--gold-primary)', borderRadius: '0 8px 8px 0', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--gold-primary)', fontSize: '11px', fontWeight: 800, flexShrink: 0, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: 1.55 }}>{insight}</p>
           </div>
          ))}
         </div>
        </div>
       )}
      </div>
     )}

     {briefTab === 'overdue' && (
      <div className="slide-in space-y-2">
       {overdueTasks.map((task, i) => {
        const srcColor = sourceColors[task.source] || 'var(--text-muted)';
        const priorityColor = task.priority === 'critical' ? 'var(--danger)' : task.priority === 'high' ? 'var(--warning)' : 'var(--gold-light)';
        return (
         <div key={i} style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 9, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: srcColor + '18', border: `1px solid ${srcColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: srcColor, flexShrink: 0 }}>
           {task.source.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
           <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{task.title}</p>
           <div className="flex items-center gap-2 mt-0.5">
            <AlertTriangle size={9} style={{ color: priorityColor }} />
            <span style={{ color: priorityColor, fontSize: '10px', fontWeight: 700 }}>{task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue</span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'capitalize' }}>{task.source}</span>
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
       {(syncLoading || aiLoading || peopleAiBusy) && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>
         {peopleAiBusy ? 'Hermes preparing bios from Outlook email history…' : syncLoading ? 'Loading calendar…' : 'Loading briefing…'}
        </p>
       )}
       {!syncLoading && !aiLoading && !peopleAiBusy && displayPeople.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>
         No meeting attendees on today&apos;s calendar.
        </p>
       )}
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {displayPeople.map((person) => (
         <div key={`${person.meetingTitle}-${person.name}`} className="person-card glass-tile lift sheen">
          <div className="flex items-center gap-3">
           <div style={{ width: 40, height: 40, borderRadius: '50%', background: person.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#ffffff', flexShrink: 0, border: '2px solid var(--gold-border)' }}>
            {person.initials}
           </div>
           <div className="flex-1 min-w-0">
            <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }} className="truncate">{person.name}</p>
            {person.role ? <p style={{ color: 'var(--text-muted)', fontSize: '11px' }} className="truncate">{person.role}</p> : null}
            {person.company ? <p style={{ color: 'var(--text-faint)', fontSize: '10px' }} className="truncate">{person.company}</p> : null}
           </div>
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
           <div style={{ flex: 1, background: 'var(--gold-muted)', border: '1px solid var(--gold-border)', borderRadius: 6, padding: '6px 10px', minWidth: 0 }}>
            <span style={{ color: 'var(--gold-primary)', fontSize: '11px', fontWeight: 600, lineHeight: 1.4 }}>{person.meetingTime} · {person.meetingTitle}</span>
           </div>
           {isInternalAttendee({ name: person.name, email: person.email }) ? (
            <span className="flex items-center gap-1" style={{ flexShrink: 0, background: 'rgba(120,120,120,0.1)', border: '1px solid rgba(120,120,120,0.25)', borderRadius: 6, padding: '3px 7px', color: 'var(--text-muted)', fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
             IFG
            </span>
           ) : person.recurring ? (
            <span className="flex items-center gap-1" style={{ flexShrink: 0, background: 'rgba(74,158,214,0.1)', border: '1px solid rgba(74,158,214,0.28)', borderRadius: 6, padding: '3px 7px', color: 'var(--info)', fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
             <Clock size={9} /> Recurring
            </span>
           ) : null}
          </div>
          {person.actionNeeded && person.actionNote ? (
           <div className="flex items-start gap-1.5" style={{ marginTop: 9, padding: '6px 10px', background: 'rgba(224,154,68,0.12)', border: '1px solid rgba(224,154,68,0.35)', borderRadius: 7 }}>
            <AlertTriangle size={12} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <div>
             <span style={{ color: 'var(--warning)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}>Action needed</span>
             <span style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.4 }}>{person.actionNote}</span>
            </div>
           </div>
          ) : null}
          {person.introducedBy && !/^(unknown|direct outreach)$/i.test(person.introducedBy) ? (
           <div className="flex items-center gap-1.5" style={{ marginTop: 9, padding: '5px 9px', background: 'rgba(45,122,86,0.08)', border: '1px solid rgba(45,122,86,0.2)', borderRadius: 7 }}>
            <UserPlus size={11} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 10.5, lineHeight: 1.3 }}>Introduced by <strong style={{ color: 'var(--text-primary)' }}>{person.introducedBy}</strong></span>
           </div>
          ) : /^direct outreach$/i.test(person.introducedBy ?? '') ? (
           <div className="flex items-center gap-1.5" style={{ marginTop: 9 }}>
            <UserPlus size={10} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>Direct outreach</span>
           </div>
          ) : null /* "Unknown" tells Kory nothing — show no line at all. */}
          {person.bio ? (
           <p style={{ color: 'var(--text-secondary)', fontSize: '11.5px', lineHeight: 1.5, marginTop: 9 }}>{person.bio}</p>
          ) : null}
          {person.relationshipContext ? (
           <div style={{ marginTop: 9 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Prior relationship</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.45 }}>{person.relationshipContext}</p>
           </div>
          ) : null}
          {person.angle ? (
           <div style={{ marginTop: 9 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Angle</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.45 }}>{person.angle}</p>
           </div>
          ) : null}
          {person.conversationTip ? (
           <div className="flex items-start gap-1.5" style={{ marginTop: 9, padding: '7px 10px', background: 'rgba(201,160,68,0.09)', border: '1px solid rgba(201,160,68,0.22)', borderRadius: 8 }}>
            <Lightbulb size={11} style={{ color: 'var(--gold-primary)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.45 }}>{person.conversationTip}</p>
           </div>
          ) : null}
         </div>
        ))}
       </div>
      </div>
     )}
    </div>

    {/* Day Summary Bar */}
    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 20px', background: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
     <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <span style={{ fontSize: '9px' }}>📋</span>
     </div>
     <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5 }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Day summary:</span>{' '}
      You have <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>{todayMeetingCount || 'no'} meeting{todayMeetingCount === 1 ? '' : 's'}</span> today with <span style={{ color: 'var(--info)', fontWeight: 700 }}>{displayPeople.length} people</span> on your calendar{overdueTasks.length > 0 ? (
       <> and <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{overdueTasks.length} overdue task{overdueTasks.length === 1 ? '' : 's'}</span></>
      ) : null}.
     </p>
    </div>
   </div>

   {/* ── Executive Snapshot: day-at-a-glance KPIs + focus guardian ── */}
   <ExecutiveSnapshot onNavigate={onNavigate} />

   {/* ── Lexi Assistant (read-only view of the scheduling agent) ── */}
   <LexiPanel />

   {/* ── Week ahead: density, family dates, reservations ── */}
   <WeekAheadPanel />

   {/* ── AI Prioritization Engine ── */}
   <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,245,238,0.5))', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, overflow: 'hidden' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
     <div className="flex items-center gap-3">
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--gold-light), #d4af60)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       <Zap size={15} className="text-[#2c2824]" />
      </div>
      <div>
       <div style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>AI Prioritization Engine</div>
       <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Scored by urgency, revenue impact, relationship risk & deadline probability</div>
      </div>
     </div>
     <div className="flex items-center gap-3">
      <span style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 20, padding: '3px 12px', color: 'var(--gold-light)', fontSize: '10px', fontWeight: 700 }}>
       {priorities.length - completedCount} Active
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
      {(priorities.length ? priorities : aiPriorityItems).map((item, idx) => (
       <PriorityCard key={item.id} item={item} rank={idx + 1} />
      ))}
     </div>
    </div>
   </div>

   {/* ── Overdue Across Platforms ── */}
   <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 14, overflow: 'hidden' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(224,82,82,0.12)', display: 'flex', alignItems: 'center', gap: 3 }}>
     <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
     <span style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginLeft: 6 }}>Overdue Across Platforms</span>
     <span style={{ marginLeft: 8, background: 'rgba(224,82,82,0.12)', color: 'var(--danger)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 10, padding: '1px 8px', fontSize: '10px', fontWeight: 700 }}>
      {overdueTasks.length}
     </span>
    </div>
    <div style={{ padding: '8px 0' }}>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x" style={{ borderColor: 'var(--border-subtle)' }}>
      {activeBriefing.overdueTasks.map((task, i) => {
       const srcColor = sourceColors[task.source] || 'var(--text-muted)';
       const priorityColor = task.priority === 'critical' ? 'var(--danger)' : task.priority === 'high' ? 'var(--warning)' : 'var(--gold-light)';
       return (
        <div key={i} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < activeBriefing.overdueTasks.length - 2 ? '1px solid var(--border-subtle)' : 'none' }} className="hover:bg-black/[0.04] transition-all">
         <div style={{ width: 24, height: 24, borderRadius: 6, background: srcColor + '18', border: `1px solid ${srcColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: srcColor, flexShrink: 0 }}>
          {task.source.slice(0, 2).toUpperCase()}
         </div>
         <div className="flex-1 min-w-0">
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }} className="truncate">{task.title}</p>
          <span style={{ color: 'var(--danger)', fontSize: '10px', fontWeight: 600 }}>
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
