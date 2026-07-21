'use client';

import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { Calendar, Video, MapPin, Phone, Flag, Sparkles, Users, FileText, Lightbulb, Link2, Mail, RefreshCw, AlertCircle, Clock, Ban } from 'lucide-react';
import { type Meeting } from '@/lib/data';
import { useSync } from '@/components/dashboard/SyncProvider';
import { useAttendeeIntel } from '@/components/dashboard/AttendeeIntelProvider';
import { isKoryAttendee } from '@/lib/outlook/meeting-people';
import { meetingAnalytics, fmtHours } from '@/lib/analytics/derive';
import { StatTile, PanelHeading } from '@/components/dashboard/ui/StatKit';
import {
  buildMeetingRelationshipSummary,
  buildMeetingTalkingPoints,
} from '@/lib/ai/meeting-local-prep';
import type { AttendeeIntel } from '@/lib/ai/types';

function intelKey(name: string, email?: string): string {
  return email?.trim().toLowerCase() || name.trim().toLowerCase();
}

const confidenceColor = {
  high: 'var(--success)',
  medium: 'var(--gold-light)',
  low: 'var(--text-muted)',
} as const;

const typeIcon = { video: Video, 'in-person': MapPin, phone: Phone };
const typeColor = { video: 'var(--info)', 'in-person': 'var(--success)', phone: '#9b59b6' };
const typeLabel = { video: 'Video Call', 'in-person': 'In Person', phone: 'Phone' };

function isRealMeeting(m: Meeting): boolean {
  return (m.scheduleKind ?? 'meeting') === 'meeting';
}

function sortByStart(a: Meeting, b: Meeting): number {
  return (a.startIso ?? '').localeCompare(b.startIso ?? '');
}

function ScheduleListRow({
  meeting,
  active,
  isLast,
  variant,
  onSelect,
}: {
  meeting: Meeting;
  active: boolean;
  isLast: boolean;
  variant: 'meeting' | 'other';
  onSelect: () => void;
}) {
  const Icon: ElementType = variant === 'meeting' ? typeIcon[meeting.type] : Ban;
  const color = variant === 'meeting' ? typeColor[meeting.type] : 'var(--text-muted)';

  return (
    <div
      onClick={onSelect}
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        background: active ? 'rgba(201,160,68,0.07)' : 'transparent',
        borderLeft: active ? '3px solid var(--gold-light)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      className="px-4 py-3 hover:bg-black/[0.04]"
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
          <p style={{ color: active ? '#e8d898' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
            {meeting.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span style={{ color, fontSize: '11px', fontWeight: 600 }}>{meeting.time}</span>
            <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{meeting.duration}</span>
            {meeting.calendarName && (
              <>
                <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>·</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }} className="truncate">{meeting.calendarName}</span>
              </>
            )}
          </div>
          {variant === 'meeting' ? (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex -space-x-1.5">
                {meeting.attendees.slice(0, 3).map((a, i) => (
                  <div
                    key={`${meeting.id}-chip-${i}`}
                    className="w-4 h-4 rounded-full flex items-center justify-center font-bold"
                    style={{ background: a.color, fontSize: '7px', color: '#ffffff', border: '1.5px solid var(--bg-card)' }}
                    title={a.name}
                  >
                    {a.initials.slice(0, 1)}
                  </div>
                ))}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: 6 }}>Block · hold · personal time</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      className="px-4 py-2 flex items-center justify-between"
      style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      <span style={{ color, fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{count}</span>
    </div>
  );
}

export default function MeetingsTab() {
  const { meetings: syncMeetings, loading: syncLoading, error: syncError, refresh } = useSync();
  const { intelByKey, loading: intelLoading } = useAttendeeIntel();
  const [expandedId, setExpandedId] = useState<string>('');
  const [items, setItems] = useState<Meeting[]>([]);
  const [aiSection, setAiSection] = useState<'points' | 'context' | 'emails' | 'bios'>('bios');

  useEffect(() => {
    setItems(syncMeetings);
    setExpandedId((prev) => {
      if (syncMeetings.some((m) => m.id === prev)) return prev;
      const firstMeeting = syncMeetings.find((m) => isRealMeeting(m));
      return firstMeeting?.id ?? syncMeetings[0]?.id ?? '';
    });
  }, [syncMeetings]);

  const mergeIntel = (meeting: Meeting): Meeting => ({
    ...meeting,
    attendees: meeting.attendees.map((a) => {
      if (isKoryAttendee(a.name)) return a;
      const intel = intelByKey.get(intelKey(a.name, a.email));
      return intel
        ? {
            ...a,
            bio: intel.bio,
            company: a.company || intel.emailContext?.companyGuess || a.company,
          }
        : a;
    }),
  });

  const loading = syncLoading;
  const error = syncError;

  const expandedRaw = items.find((m) => m.id === expandedId);
  const selectedMeeting =
    expandedRaw && isRealMeeting(expandedRaw) ? mergeIntel(expandedRaw) : null;
  const talkingPoints = selectedMeeting
    ? buildMeetingTalkingPoints(selectedMeeting, intelByKey)
    : [];
  const relationshipSummary = selectedMeeting
    ? buildMeetingRelationshipSummary(selectedMeeting, intelByKey)
    : [];

  function intelForAttendee(name: string, email?: string): AttendeeIntel | undefined {
    return intelByKey.get(intelKey(name, email));
  }

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(m => m.id === id ? { ...m, flagged: !m.flagged } : m));

  const meetingItems = [...items.filter(isRealMeeting)].sort(sortByStart);
  const otherItems = [...items.filter((m) => !isRealMeeting(m))].sort(sortByStart);

  const meetingStats = meetingAnalytics(syncMeetings);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* ── Meeting Analytics (full width) ── */}
      <div className="xl:col-span-3">
        <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,245,238,0.5))', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <PanelHeading icon={<Calendar size={16} />} title="Meeting Analytics" subtitle="Today's load & focus protection" />
          <div style={{ padding: '16px 20px' }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile icon={<Clock size={13} />} label="Day load" value={`${meetingStats.loadPct}%`} hint={`${fmtHours(meetingStats.totalMinutes)} in ${meetingStats.count} mtg${meetingStats.count === 1 ? '' : 's'}`} tone={meetingStats.loadPct >= 75 ? 'danger' : meetingStats.loadPct >= 50 ? 'warn' : 'neutral'} />
              <StatTile icon={<Users size={13} />} label="External / internal" value={`${meetingStats.externalCount} / ${meetingStats.internalCount}`} hint="people outside IFG first" />
              <StatTile icon={<Sparkles size={13} />} label="Focus block" value={meetingStats.largestGapMin > 0 ? fmtHours(meetingStats.largestGapMin) : 'None'} hint={meetingStats.largestGapLabel || 'fully booked'} tone={meetingStats.largestGapMin >= 90 ? 'good' : meetingStats.largestGapMin >= 60 ? 'neutral' : 'warn'} />
              <StatTile icon={<Clock size={13} />} label="Back-to-back" value={String(meetingStats.backToBackCount)} hint={meetingStats.backToBackCount >= 3 ? 'add a reset' : 'manageable'} tone={meetingStats.backToBackCount >= 3 ? 'warn' : 'neutral'} />
            </div>
            <div className="flex items-start gap-2" style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${meetingStats.morningProtected ? 'var(--success)' : 'var(--warning)'}`, borderRadius: '0 10px 10px 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.5 }}>
                {meetingStats.count === 0
                  ? 'No meetings today — a rare open calendar for deep work.'
                  : `${meetingStats.prepReadyCount} of ${meetingStats.count} meeting${meetingStats.count === 1 ? '' : 's'} prepped · ${meetingStats.morningProtected ? 'morning block protected' : 'morning starts early today'}${meetingStats.largestGapMin >= 90 ? ` · biggest focus window ${meetingStats.largestGapLabel}` : ''}.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Left: Meeting List ── */}
      <div className="xl:col-span-1">
        <div className="card">
          <div
            className="p-4 border-b flex items-center justify-between gap-3"
            style={{ borderColor: 'rgba(201,160,68,0.2)' }}
          >
            <div className="section-header mb-0 flex-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}
              >
                <Calendar size={13} style={{ color: 'var(--gold-light)' }} />
              </div>
              <div>
                <span className="section-title">Today&apos;s Schedule</span>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>
                  {meetingItems.length} meetings · {otherItems.length} other · Mountain Time
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refresh(true)}
              disabled={loading}
              title="Refresh from Outlook"
              style={{
                background: 'rgba(201,160,68,0.1)',
                border: '1px solid rgba(201,160,68,0.25)',
                borderRadius: 8,
                padding: '4px 8px',
                color: 'var(--gold-light)',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {error && (
            <p className="px-4 pb-2 flex items-center gap-1.5" style={{ color: 'var(--danger)', fontSize: 11 }}>
              <AlertCircle size={12} /> {error}
            </p>
          )}

          <div className="max-h-[min(70vh,720px)] overflow-y-auto">
            {!loading && items.length === 0 && (
              <p className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                No events on your calendars today.
              </p>
            )}

            {meetingItems.length > 0 && (
              <>
                <SectionLabel label="Meetings" count={meetingItems.length} color="var(--info)" />
                {meetingItems.map((meeting, idx) => (
                  <ScheduleListRow
                    key={meeting.id}
                    meeting={meeting}
                    active={expandedId === meeting.id}
                    isLast={idx === meetingItems.length - 1 && otherItems.length === 0}
                    variant="meeting"
                    onSelect={() => setExpandedId(meeting.id)}
                  />
                ))}
              </>
            )}

            {otherItems.length > 0 && (
              <>
                <SectionLabel label="Everything else" count={otherItems.length} color="#888" />
                {otherItems.map((meeting, idx) => (
                  <ScheduleListRow
                    key={meeting.id}
                    meeting={meeting}
                    active={expandedId === meeting.id}
                    isLast={idx === otherItems.length - 1}
                    variant="other"
                    onSelect={() => setExpandedId(meeting.id)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: AI Briefing + Detail ── */}
      <div className="xl:col-span-2 space-y-4">
        {expandedRaw && !isRealMeeting(expandedRaw) && (
          <div
            style={{
              background: 'var(--text-faint)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Calendar block
              </span>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{expandedRaw.title}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
              {expandedRaw.time} · {expandedRaw.duration}
              {expandedRaw.calendarName ? ` · ${expandedRaw.calendarName}` : ''}
            </p>
            {expandedRaw.location && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{expandedRaw.location}</p>
            )}
            {expandedRaw.notes && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>{expandedRaw.notes}</p>
            )}
          </div>
        )}

        {selectedMeeting && (() => {
          const meeting = selectedMeeting;
          const Icon = typeIcon[meeting.type];
          const color = typeColor[meeting.type];
          return (
            <div key={meeting.id}>
              {/* Meeting title bar */}
              <div
                style={{
                  background: 'var(--text-faint)',
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
                    <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700 }}>{meeting.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ color, fontSize: '12px', fontWeight: 600 }}>{meeting.time}</span>
                      <span style={{ color: 'var(--text-faint)' }}>·</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{meeting.duration}</span>
                      <span style={{ color: 'var(--text-faint)' }}>·</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{typeLabel[meeting.type]}</span>
                      <span style={{ color: 'var(--text-faint)' }}>·</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{meeting.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {meeting.type === 'video' && (
                    <button
                      style={{
                        background: 'linear-gradient(135deg, var(--gold-light), #d4af60)',
                        borderRadius: 8,
                        padding: '6px 14px',
                        color: '#ffffff',
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
                    <Flag size={14} fill={meeting.flagged ? 'var(--gold-light)' : 'none'} style={{ color: meeting.flagged ? 'var(--gold-light)' : 'var(--text-faint)' }} />
                  </button>
                </div>
              </div>

              {/* ── Pre-Meeting Intelligence (Outlook email + Hermes) ── */}
              <div
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid rgba(201,160,68,0.35)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    background: 'linear-gradient(90deg, var(--bg-nav) 0%, var(--bg-panel-accent) 100%)',
                    borderBottom: '1px solid rgba(201,160,68,0.2)',
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
                        background: 'linear-gradient(135deg, var(--gold-light), #d4af60)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={14} className="text-[#2c2824]" />
                    </div>
                    <div>
                      <div style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Pre-Meeting Intelligence
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                        Outlook email history · one Hermes pass per day
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(201,160,68,0.12)',
                      border: '1px solid rgba(201,160,68,0.3)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      color: 'var(--gold-light)',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    ✦ HERMES
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '0 16px', display: 'flex', gap: 0, overflowX: 'auto' }}>
                  {([
                    { key: 'bios', label: 'Attendee Bios', icon: Users },
                    { key: 'emails', label: 'Email History', icon: Mail },
                    { key: 'context', label: 'Relationship', icon: Link2 },
                    { key: 'points', label: 'Talking Points', icon: Lightbulb },
                  ] as const).map(({ key, label, icon: TabIcon }) => (
                    <button
                      key={key}
                      onClick={() => setAiSection(key)}
                      style={{
                        padding: '9px 13px',
                        fontSize: '11px',
                        fontWeight: aiSection === key ? 700 : 500,
                        color: aiSection === key ? 'var(--gold-light)' : 'var(--text-faint)',
                        background: 'none',
                        border: 'none',
                        borderBottom: aiSection === key ? '2px solid var(--gold-primary)' : '2px solid transparent',
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
                  {intelLoading && (
                    <p style={{ color: 'var(--gold-light)', fontSize: 12, marginBottom: 10 }}>Loading attendee intel from cached inbox…</p>
                  )}
                  {aiSection === 'points' && (
                    <div className="slide-in space-y-2">
                      {talkingPoints.length > 0 ? talkingPoints.map((point, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'rgba(201,160,68,0.06)',
                            border: '1px solid rgba(201,160,68,0.15)',
                            borderLeft: '3px solid var(--gold-light)',
                            borderRadius: '0 8px 8px 0',
                            padding: '9px 12px',
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                          }}
                        >
                          <span style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{point}</p>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No talking points yet — open after attendee intel loads or when emails exist for attendees.</p>
                      )}
                    </div>
                  )}

                  {aiSection === 'context' && (
                    <div className="slide-in">
                      {relationshipSummary ? (
                        <div
                          style={{
                            background: 'rgba(201,160,68,0.04)',
                            border: '1px solid rgba(201,160,68,0.15)',
                            borderRadius: 10,
                            padding: '14px 16px',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Link2 size={13} style={{ color: 'var(--gold-light)' }} />
                            <span style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              Relationship Intelligence
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                            {relationshipSummary}
                          </p>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No Outlook email thread found for these attendees in the cached inbox window.</p>
                      )}
                    </div>
                  )}

                  {aiSection === 'emails' && (
                    <div className="slide-in space-y-3">
                      {meeting.attendees.filter((a) => !isKoryAttendee(a.name)).map((a, i) => {
                        const intel = intelForAttendee(a.name, a.email);
                        const snippets = intel?.emailContext?.snippets ?? [];
                        return (
                          <div
                            key={`${meeting.id}-em-${i}`}
                            style={{
                              background: 'rgba(0,0,0,0.03)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 10,
                              padding: '12px 14px',
                            }}
                          >
                            <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{a.name}</p>
                            {snippets.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>No matching messages in today&apos;s inbox cache.</p>
                            ) : (
                              snippets.map((s, j) => (
                                <div key={j} style={{ marginTop: 8, paddingTop: 8, borderTop: j ? '1px solid var(--border-subtle)' : 'none' }}>
                                  <p style={{ color: 'var(--gold-light)', fontSize: 10, fontWeight: 700 }}>
                                    {s.direction === 'from_them' ? 'FROM THEM' : 'TO THEM'} · {s.time}
                                  </p>
                                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>{s.subject}</p>
                                  <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>{s.preview}</p>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {aiSection === 'bios' && (
                    <div className="slide-in">
                      {meeting.attendees.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No external attendees on this invite.</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {meeting.attendees.filter((a) => !isKoryAttendee(a.name)).map((attendee, i) => {
                          const intel = intelForAttendee(attendee.name, attendee.email);
                          return (
                          <div
                            key={`${meeting.id}-bio-${i}`}
                            style={{
                              background: 'rgba(0,0,0,0.03)',
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
                                color: '#ffffff',
                                flexShrink: 0,
                                border: '2px solid rgba(201,160,68,0.25)',
                              }}
                            >
                              {attendee.initials}
                            </div>
                            <div className="flex-1">
                              <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700 }}>{attendee.name}</p>
                              {attendee.company ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{attendee.company}</p>
                              ) : null}
                              {intel && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    marginTop: 4,
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: confidenceColor[intel.confidence],
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {intel.confidence} confidence
                                </span>
                              )}
                              {attendee.bio && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                                  {attendee.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          );
                        })}
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
                      <FileText size={13} style={{ color: 'var(--gold-light)' }} />
                      <span style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Agenda
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{meeting.agenda}</p>
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
                      <Lightbulb size={13} style={{ color: 'var(--gold-light)' }} />
                      <span style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Prep Notes
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{meeting.notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
