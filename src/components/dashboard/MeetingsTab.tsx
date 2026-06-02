'use client';

import { useState } from 'react';
import { Calendar, Video, MapPin, Phone, Flag, Sparkles, Users, FileText, Lightbulb, Link2 } from 'lucide-react';
import { meetings, type Meeting } from '@/lib/data';

const typeIcon = { video: Video, 'in-person': MapPin, phone: Phone };
const typeColor = { video: '#4a9ed6', 'in-person': '#4caf82', phone: '#9b59b6' };
const typeLabel = { video: 'Video Call', 'in-person': 'In Person', phone: 'Phone' };

export default function MeetingsTab() {
  const [expandedId, setExpandedId] = useState<string>(meetings[0]?.id ?? '');
  const [items, setItems] = useState<Meeting[]>(meetings);
  const [aiSection, setAiSection] = useState<'points' | 'context' | 'news' | 'bios'>('points');

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(m => m.id === id ? { ...m, flagged: !m.flagged } : m));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* ── Left: Meeting List ── */}
      <div className="xl:col-span-1">
        <div className="card">
          <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
            <div className="section-header mb-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}
              >
                <Calendar size={13} style={{ color: '#c9a044' }} />
              </div>
              <span className="section-title">Today&apos;s Schedule</span>
            </div>
          </div>

          <div>
            {items.map((meeting, idx) => {
              const active = expandedId === meeting.id;
              const Icon = typeIcon[meeting.type];
              const color = typeColor[meeting.type];
              return (
                <div
                  key={meeting.id}
                  onClick={() => setExpandedId(meeting.id)}
                  style={{
                    borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    background: active ? 'rgba(201,160,68,0.07)' : 'transparent',
                    borderLeft: active ? '3px solid #c9a044' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  className="px-4 py-3 hover:bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${color}18`,
                        border: `1px solid ${color}35`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: active ? '#e8d898' : '#e0e0e0', fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
                        {meeting.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span style={{ color, fontSize: '11px', fontWeight: 600 }}>{meeting.time}</span>
                        <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                        <span style={{ color: '#777', fontSize: '11px' }}>{meeting.duration}</span>
                        <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                        <span style={{ color: '#777', fontSize: '10px' }}>{meeting.location}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex -space-x-1.5">
                          {meeting.attendees.slice(0, 3).map(a => (
                            <div
                              key={a.name}
                              className="w-4 h-4 rounded-full flex items-center justify-center font-bold"
                              style={{ background: a.color, fontSize: '7px', color: '#2a2a2a', border: '1.5px solid #3d3d3d' }}
                              title={a.name}
                            >
                              {a.initials.slice(0, 1)}
                            </div>
                          ))}
                        </div>
                        <span style={{ color: '#666', fontSize: '10px' }}>
                          {meeting.attendees.length} attendee{meeting.attendees.length > 1 ? 's' : ''}
                        </span>
                        {meeting.flagged && (
                          <Flag size={10} fill="#c9a044" style={{ color: '#c9a044', marginLeft: 'auto' }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: AI Briefing + Detail ── */}
      <div className="xl:col-span-2 space-y-4">
        {items.filter(m => m.id === expandedId).map(meeting => {
          const Icon = typeIcon[meeting.type];
          const color = typeColor[meeting.type];
          return (
            <div key={meeting.id}>
              {/* Meeting title bar */}
              <div
                style={{
                  background: '#3a3a3a',
                  border: '1px solid rgba(201,160,68,0.25)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>{meeting.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ color, fontSize: '12px', fontWeight: 600 }}>{meeting.time}</span>
                      <span style={{ color: '#555' }}>·</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>{meeting.duration}</span>
                      <span style={{ color: '#555' }}>·</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>{typeLabel[meeting.type]}</span>
                      <span style={{ color: '#555' }}>·</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>{meeting.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {meeting.type === 'video' && (
                    <button
                      style={{
                        background: 'linear-gradient(135deg, #c9a044, #d4af60)',
                        borderRadius: 8,
                        padding: '6px 14px',
                        color: '#2a2a2a',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon size={12} />
                      Join {meeting.location}
                    </button>
                  )}
                  <button onClick={() => toggleFlag(meeting.id)} className="flag-btn">
                    <Flag size={14} fill={meeting.flagged ? '#c9a044' : 'none'} style={{ color: meeting.flagged ? '#c9a044' : '#555' }} />
                  </button>
                </div>
              </div>

              {/* ── AI Pre-Meeting Briefing ── PROMINENT */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(20,20,30,0.98) 0%, rgba(35,30,50,0.98) 100%)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 0 30px rgba(139,92,246,0.1)',
                }}
              >
                {/* AI header */}
                <div
                  style={{
                    background: 'linear-gradient(90deg, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.08) 100%)',
                    borderBottom: '1px solid rgba(139,92,246,0.25)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                      <div style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        AI Pre-Meeting Briefing
                      </div>
                      <div style={{ color: '#7c6aa0', fontSize: '10px' }}>
                        Generated for {meeting.title}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(139,92,246,0.15)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      color: '#a78bfa',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    ✦ AI POWERED
                  </div>
                </div>

                {/* AI section tabs */}
                <div style={{ borderBottom: '1px solid rgba(139,92,246,0.15)', padding: '0 16px', display: 'flex', gap: 0, overflowX: 'auto' }}>
                  {([
                    { key: 'points', label: 'Talking Points', icon: Lightbulb },
                    { key: 'context', label: 'Relationship Context', icon: Link2 },
                    { key: 'news', label: 'Recent Intel', icon: FileText },
                    { key: 'bios', label: 'Attendee Bios', icon: Users },
                  ] as const).map(({ key, label, icon: TabIcon }) => (
                    <button
                      key={key}
                      onClick={() => setAiSection(key)}
                      style={{
                        padding: '9px 13px',
                        fontSize: '11px',
                        fontWeight: aiSection === key ? 700 : 500,
                        color: aiSection === key ? '#a78bfa' : '#555',
                        background: 'none',
                        border: 'none',
                        borderBottom: aiSection === key ? '2px solid #8b5cf6' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      <TabIcon size={11} />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {/* Talking Points */}
                  {aiSection === 'points' && meeting.aiTalkingPoints && (
                    <div className="slide-in space-y-2">
                      {meeting.aiTalkingPoints.map((point, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'rgba(201,160,68,0.06)',
                            border: '1px solid rgba(201,160,68,0.15)',
                            borderLeft: '3px solid #c9a044',
                            borderRadius: '0 8px 8px 0',
                            padding: '9px 12px',
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                          }}
                        >
                          <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <p style={{ color: '#d4d0c8', fontSize: '13px', lineHeight: 1.5 }}>{point}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Relationship Context */}
                  {aiSection === 'context' && (
                    <div className="slide-in">
                      {meeting.aiRelationshipContext ? (
                        <div
                          style={{
                            background: 'rgba(201,160,68,0.04)',
                            border: '1px solid rgba(201,160,68,0.15)',
                            borderRadius: 10,
                            padding: '14px 16px',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Link2 size={13} style={{ color: '#c9a044' }} />
                            <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              Relationship Intelligence
                            </span>
                          </div>
                          <p style={{ color: '#c8c0a8', fontSize: '13px', lineHeight: 1.6 }}>
                            {meeting.aiRelationshipContext}
                          </p>
                        </div>
                      ) : (
                        <p style={{ color: '#666', fontSize: '13px' }}>No relationship context available for this meeting.</p>
                      )}
                    </div>
                  )}

                  {/* Recent News / Intel */}
                  {aiSection === 'news' && (
                    <div className="slide-in">
                      {meeting.aiRecentNews ? (
                        <div
                          style={{
                            background: 'rgba(201,160,68,0.04)',
                            border: '1px solid rgba(201,160,68,0.15)',
                            borderRadius: 10,
                            padding: '14px 16px',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <FileText size={13} style={{ color: '#c9a044' }} />
                            <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              Recent Intelligence
                            </span>
                          </div>
                          <p style={{ color: '#c8c0a8', fontSize: '13px', lineHeight: 1.6 }}>
                            {meeting.aiRecentNews}
                          </p>
                        </div>
                      ) : (
                        <p style={{ color: '#666', fontSize: '13px' }}>No recent news or intel available for attendees.</p>
                      )}
                    </div>
                  )}

                  {/* Attendee Bios */}
                  {aiSection === 'bios' && (
                    <div className="slide-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {meeting.attendees.map(attendee => (
                          <div
                            key={attendee.name}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(201,160,68,0.15)',
                              borderRadius: 10,
                              padding: '12px 14px',
                              display: 'flex',
                              gap: 12,
                              alignItems: 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                background: attendee.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#2a2a2a',
                                flexShrink: 0,
                                border: '2px solid rgba(201,160,68,0.25)',
                              }}
                            >
                              {attendee.initials}
                            </div>
                            <div className="flex-1">
                              <p style={{ color: '#f0f0f0', fontSize: '13px', fontWeight: 700 }}>{attendee.name}</p>
                              <p style={{ color: '#c9a044', fontSize: '11px', fontWeight: 600 }}>{attendee.role}</p>
                              <p style={{ color: '#777', fontSize: '11px' }}>{attendee.company}</p>
                              {attendee.bio && (
                                <p style={{ color: '#aaa', fontSize: '12px', lineHeight: 1.5, marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                  {attendee.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agenda & Prep Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meeting.agenda && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={13} style={{ color: '#c9a044' }} />
                      <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Agenda
                      </span>
                    </div>
                    <p style={{ color: '#c0c0c0', fontSize: '13px', lineHeight: 1.5 }}>{meeting.agenda}</p>
                  </div>
                )}
                {meeting.notes && (
                  <div
                    style={{
                      background: 'rgba(201,160,68,0.07)',
                      border: '1px solid rgba(201,160,68,0.25)',
                      borderRadius: 12,
                      padding: '16px',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={13} style={{ color: '#c9a044' }} />
                      <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Prep Notes
                      </span>
                    </div>
                    <p style={{ color: '#d0c090', fontSize: '13px', lineHeight: 1.5 }}>{meeting.notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
