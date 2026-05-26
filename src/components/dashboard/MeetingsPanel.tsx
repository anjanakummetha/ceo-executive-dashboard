'use client';

import { useState } from 'react';
import { Calendar, Video, MapPin, Phone, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { meetings, type Meeting } from '@/lib/data';

const typeIcon = { video: Video, 'in-person': MapPin, phone: Phone };
const typeColor = { video: '#4a9ed6', 'in-person': '#4caf82', phone: '#9b59b6' };

export default function MeetingsPanel() {
  const [expandedId, setExpandedId] = useState<string | null>('m1');
  const [items, setItems] = useState<Meeting[]>(meetings);

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(m => m.id === id ? { ...m, flagged: !m.flagged } : m));

  return (
    <div className="card flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="section-header mb-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}
            >
              <Calendar size={13} style={{ color: '#c9a044' }} />
            </div>
            <span className="section-title">Today&apos;s Meetings</span>
          </div>
          <span className="badge-gold">{items.length} Scheduled</span>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
        {items.map((meeting, idx) => {
          const expanded = expandedId === meeting.id;
          const Icon = typeIcon[meeting.type];

          return (
            <div
              key={meeting.id}
              style={{
                borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {/* Meeting row */}
              <div
                onClick={() => setExpandedId(expanded ? null : meeting.id)}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                className="px-4 py-3 hover:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  {/* Time indicator */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: meeting.flagged ? '#c9a044' : typeColor[meeting.type] }}
                    />
                    {idx < items.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.1)', minHeight: '30px' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={11} style={{ color: typeColor[meeting.type], flexShrink: 0 }} />
                          <span style={{ color: '#888', fontSize: '11px', fontWeight: 600 }}>{meeting.time}</span>
                          <span style={{ color: '#555', fontSize: '11px' }}>· {meeting.duration}</span>
                        </div>
                        <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }} className="leading-snug">
                          {meeting.title}
                        </p>
                        <p style={{ color: '#777', fontSize: '11px' }} className="mt-0.5">{meeting.location}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFlag(meeting.id); }}
                          className="flag-btn"
                        >
                          <Flag
                            size={12}
                            fill={meeting.flagged ? '#c9a044' : 'none'}
                            style={{ color: meeting.flagged ? '#c9a044' : '#555' }}
                          />
                        </button>
                        {expanded ? (
                          <ChevronUp size={13} style={{ color: '#666' }} />
                        ) : (
                          <ChevronDown size={13} style={{ color: '#666' }} />
                        )}
                      </div>
                    </div>

                    {/* Attendee avatars preview */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex -space-x-1.5">
                        {meeting.attendees.slice(0, 4).map((a) => (
                          <div
                            key={a.name}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[#2a2a2a] font-bold"
                            style={{ background: a.color, fontSize: '8px', border: '1.5px solid #3d3d3d' }}
                            title={a.name}
                          >
                            {a.initials}
                          </div>
                        ))}
                      </div>
                      <span style={{ color: '#666', fontSize: '10px' }}>
                        {meeting.attendees.length} attendee{meeting.attendees.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                  className="px-4 py-3 slide-in"
                >
                  {/* Agenda */}
                  {meeting.agenda && (
                    <div className="mb-3">
                      <p style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Agenda
                      </p>
                      <p style={{ color: '#bbb', fontSize: '12px', lineHeight: 1.5 }}>{meeting.agenda}</p>
                    </div>
                  )}

                  {/* Prep notes */}
                  {meeting.notes && (
                    <div
                      style={{ background: 'rgba(201,160,68,0.08)', border: '1px solid rgba(201,160,68,0.2)', borderRadius: 8, padding: '8px 10px', marginBottom: '12px' }}
                    >
                      <p style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Prep Notes
                      </p>
                      <p style={{ color: '#d0c090', fontSize: '12px', lineHeight: 1.5 }}>{meeting.notes}</p>
                    </div>
                  )}

                  {/* Attendee bios */}
                  <p style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Attendees &amp; Bios
                  </p>
                  <div className="flex flex-col gap-2">
                    {meeting.attendees.map((attendee) => (
                      <div
                        key={attendee.name}
                        style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.07)' }}
                        className="flex items-start gap-2.5"
                      >
                        <div
                          className="avatar text-[#2a2a2a]"
                          style={{ background: attendee.color, width: 32, height: 32, fontSize: '10px' }}
                        >
                          {attendee.initials}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#e0e0e0', fontSize: '12px', fontWeight: 600 }}>{attendee.name}</span>
                          </div>
                          <span style={{ color: '#888', fontSize: '11px' }}>{attendee.role} · {attendee.company}</span>
                          {attendee.bio && (
                            <p style={{ color: '#999', fontSize: '11px', lineHeight: 1.4, marginTop: '3px' }}>{attendee.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Join button */}
                  {meeting.type === 'video' && (
                    <button
                      style={{
                        marginTop: '10px',
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
                        gap: '6px',
                      }}
                    >
                      <Video size={12} />
                      Join {meeting.location}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
