'use client';

import { useState } from 'react';
import { TrendingUp, Phone, Flag, CheckCircle2, Clock, ExternalLink, DollarSign, MessageSquare } from 'lucide-react';
import { asanaTasks, hubspotTasks, calls, type AsanaTask, type HubSpotTask, type Call } from '@/lib/data';

const asanaStatusConfig = {
  overdue:      { color: '#e05252', bg: 'rgba(224,82,82,0.12)',    label: 'OVERDUE' },
  'due-today':  { color: '#e09a44', bg: 'rgba(224,154,68,0.12)',   label: 'DUE TODAY' },
  'in-progress':{ color: '#4a9ed6', bg: 'rgba(74,158,214,0.12)',   label: 'IN PROGRESS' },
  upcoming:     { color: '#4caf82', bg: 'rgba(76,175,130,0.12)',   label: 'UPCOMING' },
};

const priorityDots = { critical: '#e05252', high: '#e09a44', medium: '#c9a044', low: '#4caf82' };

const hubTypeConfig = {
  'follow-up': { color: '#c9a044', emoji: '🔄' },
  call:        { color: '#4a9ed6', emoji: '📞' },
  email:       { color: '#9b59b6', emoji: '✉️' },
  demo:        { color: '#4caf82', emoji: '🖥️' },
  proposal:    { color: '#e09a44', emoji: '📋' },
};

const callTypeConfig = {
  'follow-up': { icon: Phone, color: '#c9a044', label: 'Follow-up' },
  scheduled:   { icon: Phone, color: '#4a9ed6', label: 'Scheduled' },
  incoming:    { icon: Phone, color: '#4caf82', label: 'Incoming' },
  outgoing:    { icon: Phone, color: '#9b59b6', label: 'Outgoing' },
};

export default function TasksTab() {
  const [asanaItems, setAsanaItems] = useState<AsanaTask[]>(asanaTasks);
  const [hubItems, setHubItems] = useState<HubSpotTask[]>(hubspotTasks);
  const [callItems, setCallItems] = useState<Call[]>(calls);
  const [asanaFilter, setAsanaFilter] = useState<'all' | 'overdue' | 'due-today'>('all');

  const toggleAsanaFlag = (id: string) => setAsanaItems(p => p.map(t => t.id === id ? { ...t, flagged: !t.flagged } : t));
  const toggleHubFlag = (id: string) => setHubItems(p => p.map(t => t.id === id ? { ...t, flagged: !t.flagged } : t));
  const toggleCallFlag = (id: string) => setCallItems(p => p.map(c => c.id === id ? { ...c, flagged: !c.flagged } : c));
  const toggleCallDone = (id: string) => setCallItems(p => p.map(c => c.id === id ? { ...c, completed: !c.completed } : c));

  const filteredAsana = asanaItems.filter(t => {
    if (asanaFilter === 'overdue') return t.status === 'overdue';
    if (asanaFilter === 'due-today') return t.status === 'due-today';
    return true;
  });

  const overdueCount = asanaItems.filter(t => t.status === 'overdue').length;
  const missedCalls = callItems.filter(c => c.type === 'incoming' && !c.completed).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* ── Asana Tasks ── */}
      <div className="xl:col-span-1">
        <div className="card flex flex-col">
          <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="section-header mb-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)', color: '#c9a044' }}>
                  A
                </div>
                <span className="section-title">Asana Tasks</span>
              </div>
              <div className="flex items-center gap-1.5">
                {overdueCount > 0 && <span className="badge-danger">{overdueCount} Overdue</span>}
                <button style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '4px 8px', color: '#c9a044', fontSize: 11, cursor: 'pointer' }}>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
            <div className="flex gap-1">
              {(['all', 'overdue', 'due-today'] as const).map(f => (
                <button key={f} onClick={() => setAsanaFilter(f)}
                  style={{ background: asanaFilter === f ? 'rgba(201,160,68,0.2)' : 'transparent', border: `1px solid ${asanaFilter === f ? 'rgba(201,160,68,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '3px 10px', color: asanaFilter === f ? '#c9a044' : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {f === 'due-today' ? 'Due Today' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
            {filteredAsana.map((task, idx) => {
              const sc = asanaStatusConfig[task.status];
              return (
                <div key={task.id} style={{ borderBottom: idx < filteredAsana.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'all 0.2s' }} className="px-4 py-3 hover:bg-white/5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: priorityDots[task.priority], boxShadow: `0 0 6px ${priorityDots[task.priority]}60` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>{task.title}</p>
                        <button onClick={() => toggleAsanaFlag(task.id)} className="flag-btn flex-shrink-0">
                          <Flag size={11} fill={task.flagged ? '#c9a044' : 'none'} style={{ color: task.flagged ? '#c9a044' : '#555' }} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span style={{ background: sc.bg, color: sc.color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', padding: '2px 6px', borderRadius: 4, border: `1px solid ${sc.color}40` }}>
                          {sc.label}
                        </span>
                        <span style={{ color: '#666', fontSize: '10px' }}>{task.project}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <Clock size={9} style={{ color: '#666' }} />
                          <span style={{ color: '#666', fontSize: '10px' }}>{task.dueDate}</span>
                        </div>
                      </div>
                      {task.subtasks && task.subtasks > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ color: '#666', fontSize: '10px' }}>Subtasks: {task.completedSubtasks}/{task.subtasks}</span>
                            <span style={{ color: '#888', fontSize: '10px' }}>{Math.round(((task.completedSubtasks || 0) / task.subtasks) * 100)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${((task.completedSubtasks || 0) / task.subtasks) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(201,160,68,0.15)' }}>
            <span style={{ color: '#666', fontSize: '11px' }}>{asanaItems.length} tasks</span>
            <button style={{ color: '#c9a044', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>Open Asana →</button>
          </div>
        </div>
      </div>

      {/* ── HubSpot + Calls ── */}
      <div className="xl:col-span-2 space-y-5">
        {/* HubSpot */}
        <div className="card">
          <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
            <div className="flex items-center justify-between">
              <div className="section-header mb-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}>
                  <TrendingUp size={13} style={{ color: '#c9a044' }} />
                </div>
                <span className="section-title">HubSpot Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ background: 'rgba(76,175,130,0.1)', border: '1px solid rgba(76,175,130,0.25)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <DollarSign size={11} style={{ color: '#4caf82' }} />
                  <span style={{ color: '#4caf82', fontSize: '12px', fontWeight: 700 }}>$3,025,000</span>
                </div>
                <button style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '4px 8px', color: '#c9a044', fontSize: 11, cursor: 'pointer' }}>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {hubItems.map((task, idx) => {
              const tc = hubTypeConfig[task.type];
              const isOverdue = task.dueDate.includes('ago');
              return (
                <div key={task.id} style={{ borderBottom: idx < hubItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderRight: idx % 2 === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'all 0.2s' }} className="px-4 py-3 hover:bg-white/5">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">{tc.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p style={{ color: '#e0e0e0', fontSize: '12px', fontWeight: 500, lineHeight: 1.3 }}>{task.title}</p>
                        <button onClick={() => toggleHubFlag(task.id)} className="flag-btn flex-shrink-0">
                          <Flag size={11} fill={task.flagged ? '#c9a044' : 'none'} style={{ color: task.flagged ? '#c9a044' : '#555' }} />
                        </button>
                      </div>
                      <p style={{ color: '#888', fontSize: '11px', marginTop: 2 }}>{task.contact} · {task.company}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {task.stage && <span style={{ background: 'rgba(255,255,255,0.06)', color: '#999', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>{task.stage}</span>}
                        {task.dealValue && <span style={{ color: '#4caf82', fontSize: '11px', fontWeight: 700 }}>{task.dealValue}</span>}
                        <div className="flex items-center gap-1 ml-auto">
                          <Clock size={9} style={{ color: isOverdue ? '#e05252' : '#666' }} />
                          <span style={{ color: isOverdue ? '#e05252' : '#666', fontSize: '10px', fontWeight: isOverdue ? 600 : 400 }}>{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calls & Follow-ups */}
        <div className="card">
          <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
            <div className="flex items-center justify-between">
              <div className="section-header mb-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}>
                  <Phone size={13} style={{ color: '#c9a044' }} />
                </div>
                <span className="section-title">Calls &amp; Follow-ups</span>
              </div>
              <div className="flex items-center gap-2">
                {missedCalls > 0 && <span className="badge-danger">{missedCalls} Missed</span>}
                <span className="badge-gold">{callItems.filter(c => !c.completed).length} Pending</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {callItems.map((call, idx) => {
              const { icon: Icon, color, label } = callTypeConfig[call.type];
              return (
                <div key={call.id} style={{ borderBottom: idx < callItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderRight: idx % 2 === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: call.completed ? 0.5 : 1, transition: 'all 0.2s' }} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="avatar text-[#2a2a2a] flex-shrink-0" style={{ background: call.contactColor, fontSize: '11px' }}>
                      {call.contactInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }}>{call.contact}</span>
                            {call.type === 'incoming' && !call.completed && <span className="badge-danger" style={{ fontSize: '9px', padding: '1px 5px' }}>Missed</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Icon size={10} style={{ color, flexShrink: 0 }} />
                            <span style={{ color, fontSize: '10px', fontWeight: 600 }}>{label}</span>
                            <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                            <span style={{ color: '#888', fontSize: '10px' }}>{call.company}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => toggleCallFlag(call.id)} className="flag-btn">
                            <Flag size={11} fill={call.flagged ? '#c9a044' : 'none'} style={{ color: call.flagged ? '#c9a044' : '#555' }} />
                          </button>
                          <button onClick={() => toggleCallDone(call.id)} className="flag-btn">
                            <CheckCircle2 size={11} fill={call.completed ? '#4caf82' : 'none'} style={{ color: call.completed ? '#4caf82' : '#555' }} />
                          </button>
                        </div>
                      </div>
                      <p style={{ color: '#777', fontSize: '11px', lineHeight: 1.4, marginTop: 4, borderLeft: `2px solid ${color}`, paddingLeft: 6 }}>{call.notes}</p>
                      {!call.completed && (
                        <div className="flex gap-2 mt-2">
                          <button style={{ background: 'rgba(76,175,130,0.12)', border: '1px solid rgba(76,175,130,0.3)', borderRadius: 6, padding: '3px 8px', color: '#4caf82', fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={9} />{call.type === 'incoming' ? 'Call Back' : 'Call Now'}
                          </button>
                          <button style={{ background: 'rgba(74,158,214,0.12)', border: '1px solid rgba(74,158,214,0.3)', borderRadius: 6, padding: '3px 8px', color: '#4a9ed6', fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MessageSquare size={9} />Note
                          </button>
                        </div>
                      )}
                    </div>
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
