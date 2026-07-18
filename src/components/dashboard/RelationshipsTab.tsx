'use client';

import { useMemo } from 'react';
import { Calendar, RefreshCw, AlertCircle, Mail } from 'lucide-react';
import { dedupeAttendees } from '@/lib/outlook/meeting-people';
import { useSync } from '@/components/dashboard/SyncProvider';
import { useAttendeeIntel } from '@/components/dashboard/AttendeeIntelProvider';

const confidenceColor = {
  high: 'var(--success)',
  medium: 'var(--gold-light)',
  low: 'var(--text-muted)',
} as const;

export default function RelationshipsTab() {
  const { meetings, loading, error, refresh } = useSync();
  const { intelByKey, loading: intelLoading, refreshIntel } = useAttendeeIntel();

  const meetingsWithIntel = useMemo(() => {
    return meetings.map((m) => ({
      ...m,
      attendees: m.attendees.map((a) => {
        const key = a.email?.trim().toLowerCase() || a.name.trim().toLowerCase();
        const intel = intelByKey.get(key);
        return intel
          ? {
              ...a,
              bio: intel.bio,
              company: a.company || intel.emailContext?.companyGuess || a.company,
            }
          : a;
      }),
    }));
  }, [meetings, intelByKey]);

  const meetingGroups = useMemo(() => {
    return [...meetingsWithIntel]
      .filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting')
      .sort((a, b) => (a.startIso ?? a.time).localeCompare(b.startIso ?? b.time))
      .map((meeting) => ({
        meeting,
        attendees: dedupeAttendees(meeting.attendees, true),
      }));
  }, [meetingsWithIntel]);

  const peopleCount = meetingGroups.reduce((n, g) => n + g.attendees.length, 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="dashboard-panel">
        <div className="dashboard-panel-header flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--gold-muted)',
                border: '1px solid var(--gold-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={15} style={{ color: 'var(--gold-primary)' }} />
            </div>
            <div>
              <div
                style={{
                  color: 'var(--gold-primary)',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                Today&apos;s Meeting People
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 2 }}>
                Bios from Outlook email history · one Hermes run per day
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(loading || intelLoading) && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Syncing…</span>
            )}
            {!loading && meetingGroups.length > 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {meetingGroups.length} meetings · {peopleCount} people
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                refresh(true);
                refreshIntel();
              }}
              disabled={loading || intelLoading}
              title="Refresh calendar + regenerate intel"
              className="flex items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04]"
              style={{
                background: 'var(--gold-muted)',
                border: '1px solid var(--gold-border)',
                padding: '6px 10px',
                color: 'var(--gold-primary)',
                cursor: loading || intelLoading ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={12} className={loading || intelLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <p className="px-5 py-3 flex items-center gap-1.5" style={{ color: 'var(--danger)', fontSize: 12 }}>
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <div style={{ padding: '20px' }} className="space-y-4">
          {!loading && !intelLoading && meetingGroups.length === 0 && (
            <p className="text-center py-12" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              No meetings with attendees on your calendar today.
            </p>
          )}

          {meetingGroups.map(({ meeting, attendees }) => (
            <div key={meeting.id} className="meeting-group">
              <div className="meeting-group-header">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
                    {meeting.title}
                  </p>
                  <p style={{ color: 'var(--gold-primary)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {meeting.time} · {meeting.duration}
                  </p>
                </div>
                {meeting.location && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{meeting.location}</p>
                )}
              </div>

              <div style={{ padding: '14px 16px' }}>
                {attendees.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No other attendees listed</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {attendees.map((attendee, idx) => {
                      const key =
                        attendee.email?.trim().toLowerCase() ||
                        attendee.name.trim().toLowerCase();
                      const intel = intelByKey.get(key);
                      return (
                        <div key={`${meeting.id}-${idx}-${attendee.name}`} className="person-card">
                          <div className="flex items-center gap-3">
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                background: attendee.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#ffffff',
                                flexShrink: 0,
                                border: '2px solid var(--gold-border)',
                              }}
                            >
                              {attendee.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                style={{
                                  color: 'var(--text-primary)',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  lineHeight: 1.3,
                                }}
                                className="truncate"
                              >
                                {attendee.name}
                              </p>
                              {attendee.email ? (
                                <p style={{ color: 'var(--text-faint)', fontSize: 10 }} className="truncate">
                                  {attendee.email}
                                </p>
                              ) : null}
                              {attendee.company ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: 11 }} className="truncate">
                                  {attendee.company}
                                </p>
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
                            </div>
                          </div>
                          {intel?.emailContext?.snippets?.length ? (
                            <div style={{ marginTop: 10 }}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Mail size={10} style={{ color: 'var(--gold-light)' }} />
                                <span style={{ color: 'var(--gold-light)', fontSize: 10, fontWeight: 700 }}>
                                  Recent Outlook
                                </span>
                              </div>
                              {intel.emailContext.snippets.slice(0, 2).map((s, j) => (
                                <p
                                  key={j}
                                  style={{
                                    color: 'var(--text-muted)',
                                    fontSize: 11,
                                    lineHeight: 1.45,
                                    marginTop: j ? 6 : 0,
                                  }}
                                >
                                  {s.direction === 'from_them' ? '←' : '→'} {s.subject}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          {attendee.bio ? (
                            <p
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: 12,
                                lineHeight: 1.55,
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: '1px solid var(--border-subtle)',
                              }}
                            >
                              {attendee.bio}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ color: 'var(--text-faint)', fontSize: 11, textAlign: 'center' }}>
        Email context from cached inbox sync · no extra search per person
      </p>
    </div>
  );
}
