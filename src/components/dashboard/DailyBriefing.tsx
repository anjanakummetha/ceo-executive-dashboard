'use client';

import { useState } from 'react';
import { Mail, AlertTriangle, ChevronDown, ChevronUp, Clock, Zap, FileText, Users, Video, MapPin, Phone } from 'lucide-react';
import { dailyBriefing, meetings } from '@/lib/data';

const sourceColors: Record<string, string> = {
  asana: '#4a9ed6',
  hubspot: '#e09a44',
  email: '#9b59b6',
  calendar: '#4caf82',
  linkedin: '#0a66c2',
  personal: '#c9a044',
};

const priorityColors = { critical: '#e05252', high: '#e09a44', medium: '#c9a044', low: '#4caf82' };

const meetingTypeIcon = { video: Video, 'in-person': MapPin, phone: Phone };
const meetingTypeColor = { video: '#4a9ed6', 'in-person': '#4caf82', phone: '#9b59b6' };

export default function DailyBriefing() {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'overdue' | 'people'>('insights');

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
        <div className="slide-in">
          {/* Tab bar */}
          <div
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 16px', display: 'flex', gap: 0 }}
          >
            {([
              { key: 'insights', label: 'Key Insights', icon: Zap },
              { key: 'overdue', label: 'Overdue Tasks', icon: AlertTriangle },
              { key: 'people', label: "Today's People", icon: Users },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={(e) => { e.stopPropagation(); setActiveTab(key); }}
                style={{
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: activeTab === key ? '#c9a044' : '#666',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === key ? '2px solid #c9a044' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* ── Tab: Key Insights ── */}
            {activeTab === 'insights' && (
              <div className="slide-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

                {/* Day summary note */}
                <div
                  style={{
                    marginTop: '12px',
                    background: 'rgba(201,160,68,0.06)',
                    border: '1px solid rgba(201,160,68,0.2)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <FileText size={13} style={{ color: '#c9a044', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: '#c0a060', fontSize: '12px', lineHeight: 1.5 }}>
                    <strong>Day summary:</strong> You have <strong>4 meetings</strong>, <strong>2 critical tasks</strong> due today,
                    and <strong>3 LinkedIn messages</strong> awaiting response.
                    Recommend blocking 30 min before the 10:30 AM board call to finalize the deck.
                  </p>
                </div>
              </div>
            )}

            {/* ── Tab: Overdue Tasks ── */}
            {activeTab === 'overdue' && (
              <div className="slide-in flex flex-col gap-2">
                {dailyBriefing.overdueTasks.map((task, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(224,82,82,0.06)',
                      border: '1px solid rgba(224,82,82,0.2)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white font-bold"
                      style={{ background: sourceColors[task.source], fontSize: '9px' }}
                    >
                      {task.source.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#d0d0d0', fontSize: '13px', fontWeight: 500 }}>{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={9} style={{ color: '#e05252' }} />
                        <span style={{ color: '#e05252', fontSize: '10px', fontWeight: 600 }}>
                          {task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue
                        </span>
                        <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                        <span style={{ color: '#888', fontSize: '10px', textTransform: 'capitalize' }}>{task.source}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        background: `${priorityColors[task.priority]}20`,
                        color: priorityColors[task.priority],
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
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
            )}

            {/* ── Tab: Today's People (Meeting Context & Bios) ── */}
            {activeTab === 'people' && (
              <div className="slide-in space-y-4">
                {meetings.map((meeting) => {
                  const Icon = meetingTypeIcon[meeting.type];
                  const typeColor = meetingTypeColor[meeting.type];
                  return (
                    <div
                      key={meeting.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Meeting header */}
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: `${typeColor}20`,
                            border: `1px solid ${typeColor}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={13} style={{ color: typeColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }}>{meeting.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span style={{ color: typeColor, fontSize: '11px', fontWeight: 600 }}>{meeting.time}</span>
                            <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                            <span style={{ color: '#888', fontSize: '11px' }}>{meeting.duration}</span>
                            <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                            <span style={{ color: '#888', fontSize: '11px' }}>{meeting.location}</span>
                          </div>
                        </div>
                        {meeting.flagged && (
                          <span
                            style={{
                              background: 'rgba(201,160,68,0.15)',
                              border: '1px solid rgba(201,160,68,0.35)',
                              borderRadius: 20,
                              padding: '2px 8px',
                              color: '#c9a044',
                              fontSize: '9px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            PRIORITY
                          </span>
                        )}
                      </div>

                      {/* Agenda */}
                      {meeting.agenda && (
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ color: '#777', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 3 }}>Agenda</p>
                          <p style={{ color: '#bbb', fontSize: '12px', lineHeight: 1.4 }}>{meeting.agenda}</p>
                        </div>
                      )}

                      {/* Prep notes */}
                      {meeting.notes && (
                        <div
                          style={{
                            margin: '8px 12px',
                            background: 'rgba(201,160,68,0.07)',
                            border: '1px solid rgba(201,160,68,0.2)',
                            borderRadius: 7,
                            padding: '7px 10px',
                          }}
                        >
                          <p style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 3 }}>Prep Notes</p>
                          <p style={{ color: '#d0c090', fontSize: '12px', lineHeight: 1.4 }}>{meeting.notes}</p>
                        </div>
                      )}

                      {/* Attendee bios */}
                      <div style={{ padding: '8px 12px 12px' }}>
                        <p style={{ color: '#777', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
                          Attendees — {meeting.attendees.length} {meeting.attendees.length === 1 ? 'Person' : 'People'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                          {meeting.attendees.map((attendee) => (
                            <div
                              key={attendee.name}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8,
                                padding: '8px 10px',
                                display: 'flex',
                                gap: 10,
                                alignItems: 'flex-start',
                              }}
                            >
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '50%',
                                  background: attendee.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#2a2a2a',
                                  flexShrink: 0,
                                }}
                              >
                                {attendee.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p style={{ color: '#e0e0e0', fontSize: '12px', fontWeight: 600 }}>{attendee.name}</p>
                                <p style={{ color: '#888', fontSize: '11px' }}>{attendee.role}</p>
                                <p style={{ color: '#666', fontSize: '10px' }}>{attendee.company}</p>
                                {attendee.bio && (
                                  <p style={{ color: '#999', fontSize: '11px', lineHeight: 1.4, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    {attendee.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
