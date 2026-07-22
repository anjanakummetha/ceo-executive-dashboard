'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plane,
  Hotel,
  Car,
  Train,
  Utensils,
  Star,
  Flag,
  AlertTriangle,
  MapPin,
  Clock,
  RefreshCw,
  ExternalLink,
  Calendar,
  Gift,
  Users,
} from 'lucide-react';
import { travelSegments as mockTravel, type TravelSegment } from '@/lib/data';

const typeConfig = {
  flight: { icon: Plane, color: 'var(--info)', bg: 'rgba(74,158,214,0.15)', label: 'Flight' },
  hotel: { icon: Hotel, color: 'var(--gold-light)', bg: 'rgba(201,160,68,0.15)', label: 'Hotel' },
  car: { icon: Car, color: '#27ae60', bg: 'rgba(39,174,96,0.15)', label: 'Car Service' },
  train: { icon: Train, color: '#9b59b6', bg: 'rgba(155,89,182,0.15)', label: 'Train' },
  restaurant: { icon: Utensils, color: 'var(--warning)', bg: 'rgba(224,154,68,0.15)', label: 'Dining' },
  other: { icon: Star, color: 'var(--danger)', bg: 'rgba(224,82,82,0.15)', label: 'Event' },
};

const statusConfig = {
  confirmed: { color: 'var(--success)', bg: 'rgba(76,175,130,0.12)', label: 'CONFIRMED' },
  pending: { color: 'var(--warning)', bg: 'rgba(224,154,68,0.12)', label: 'PENDING' },
  'checked-in': { color: 'var(--info)', bg: 'rgba(74,158,214,0.12)', label: 'CHECKED IN' },
  completed: { color: 'var(--text-muted)', bg: 'rgba(100,100,100,0.12)', label: 'COMPLETED' },
};

const kindConfig = {
  family: { label: 'Family', color: 'var(--gold-light)', icon: Users },
  travel: { label: 'Travel', color: 'var(--info)', icon: Plane },
  birthday: { label: 'Birthday', color: 'var(--warning)', icon: Gift },
  personal: { label: 'Personal', color: '#9b59b6', icon: Star },
};

function groupByDate(segments: TravelSegment[]) {
  return segments.reduce(
    (acc, seg) => {
      const key = seg.sortDate ?? seg.date;
      if (!acc[key]) acc[key] = { label: seg.date, items: [] };
      acc[key].items.push(seg);
      return acc;
    },
    {} as Record<string, { label: string; items: TravelSegment[] }>,
  );
}

export default function TravelTab() {
  const [items, setItems] = useState<TravelSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [rangeLabel, setRangeLabel] = useState('');
  const [calendarNames, setCalendarNames] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/outlook/travel', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load events');
      setItems(json.segments ?? []);
      setIsLive(true);
      const past = json.range?.daysPast ?? 7;
      const ahead = json.range?.daysAhead ?? 90;
      setRangeLabel(`${past}d back · ${ahead}d ahead`);
      const names = (json.calendars ?? []).map((c: { name: string }) => c.name);
      setCalendarNames(names);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setIsLive(false);
      setItems(mockTravel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; load() is shared with the refresh button so its setLoading must stay (no cascading render)
    load();
  }, [load]);

  const groups = groupByDate(items);
  const sortedGroupKeys = Object.keys(groups).sort();
  const urgentCount = items.filter((s) => s.flagged).length;
  const upcoming = items.filter((s) => s.status !== 'completed');

  const nextTrip = useMemo(() => {
    const next = upcoming[0];
    if (!next) return null;
    return next;
  }, [upcoming]);

  const familyCount = items.filter((s) => s.eventKind === 'family').length;
  const travelCount = items.filter((s) => s.eventKind === 'travel').length;
  const birthdayCount = items.filter((s) => s.eventKind === 'birthday').length;

  return (
    <div className="space-y-5">
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(74,158,214,0.12) 0%, rgba(44,44,54,0.95) 100%)',
          border: '1px solid rgba(74,158,214,0.3)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(74,158,214,0.2)',
              border: '1px solid rgba(74,158,214,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plane size={18} style={{ color: 'var(--info)' }} />
          </div>
          <div>
            <div
              style={{
                color: 'var(--info)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Travel &amp; Family
            </div>
            {nextTrip ? (
              <>
                <div style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700 }}>{nextTrip.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {nextTrip.date} · {nextTrip.time}
                  {nextTrip.location ? ` · ${nextTrip.location}` : ''}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No upcoming travel or family events</div>
            )}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {loading && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Syncing…</span>}
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            title="Refresh from Outlook"
            style={{
              background: 'rgba(74,158,214,0.12)',
              border: '1px solid rgba(74,158,214,0.3)',
              borderRadius: 8,
              padding: '4px 8px',
              color: 'var(--info)',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--gold-light)', fontSize: '18px', fontWeight: 700 }}>{items.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Events</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--success)', fontSize: '18px', fontWeight: 700 }}>{upcoming.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Upcoming</div>
          </div>
          {urgentCount > 0 && (
            <>
              <div style={{ width: 1, height: 32, background: 'var(--border-subtle)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--danger)', fontSize: '18px', fontWeight: 700 }}>{urgentCount}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Flagged</div>
              </div>
            </>
          )}
        </div>
      </div>

      {isLive && (
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: -8 }}>
          Outlook · {rangeLabel}
          {calendarNames.length > 0 && (
            <> · Calendars: {calendarNames.filter((n) => /birthday|master|family|travel/i.test(n)).join(', ') || calendarNames.join(', ')}</>
          )}
          {' · '}
          <span style={{ color: 'var(--text-muted)' }}>
            {familyCount} family · {travelCount} travel · {birthdayCount} birthdays
          </span>
        </p>
      )}

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 11 }}>
          {error} — showing fallback data.
        </p>
      )}

      {items.filter((s) => s.flagged).length > 0 && (
        <div
          style={{
            background: 'rgba(224,82,82,0.07)',
            border: '1px solid rgba(224,82,82,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} style={{ color: 'var(--danger)' }} />
            <span
              style={{
                color: 'var(--danger)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Needs attention
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {items
              .filter((s) => s.flagged)
              .map((seg) => {
                const tc = typeConfig[seg.type];
                const Icon = tc.icon;
                return (
                  <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={12} style={{ color: tc.color }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{seg.title}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      · {seg.date} at {seg.time}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          No travel or family events in this range. Try refreshing or check Outlook calendars.
        </p>
      )}

      {sortedGroupKeys.map((key) => {
        const { label, items: segs } = groups[key];
        return (
          <div key={key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ height: 1, flex: 1, background: 'rgba(201,160,68,0.2)' }} />
              <span
                style={{
                  color: 'var(--gold-light)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
              <div style={{ height: 1, flex: 1, background: 'rgba(201,160,68,0.2)' }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {segs.map((seg) => {
                const tc = typeConfig[seg.type];
                const sc = statusConfig[seg.status];
                const Icon = tc.icon;
                const kind = seg.eventKind ? kindConfig[seg.eventKind] : null;
                const KindIcon = kind?.icon ?? Calendar;

                return (
                  <div
                    key={seg.id}
                    style={{
                      background: 'var(--bg-panel)',
                      border: `1px solid ${seg.flagged ? 'rgba(201,160,68,0.4)' : 'var(--border-subtle)'}`,
                      borderTop: `3px solid ${tc.color}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                    }}
                    className="card-hover"
                  >
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: tc.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={15} style={{ color: tc.color }} />
                          </div>
                          <span
                            style={{
                              background: `${tc.color}20`,
                              color: tc.color,
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {tc.label}
                          </span>
                          {kind && (
                            <span
                              style={{
                                background: `${kind.color}18`,
                                color: kind.color,
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <KindIcon size={9} />
                              {kind.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{
                              background: sc.bg,
                              color: sc.color,
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: `1px solid ${sc.color}30`,
                            }}
                          >
                            {sc.label}
                          </span>
                          {seg.flagged && (
                            <span title="Flagged in Outlook">
                              <Flag size={12} fill="var(--gold-light)" style={{ color: 'var(--gold-light)' }} />
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginTop: 8, lineHeight: 1.3 }}>
                        {seg.title}
                      </p>
                    </div>

                    <div style={{ padding: '10px 14px' }} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {seg.time}
                          {seg.endTime ? ` → ${seg.endTime}` : ''}
                        </span>
                      </div>
                      {seg.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{seg.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{seg.provider ?? seg.calendarName}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.4 }}>{seg.details}</p>
                      {seg.notes && (
                        <div
                          style={{
                            background: 'var(--border-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 6,
                            padding: '6px 8px',
                          }}
                        >
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.4 }}>{seg.notes}</p>
                        </div>
                      )}
                      {seg.webLink && (
                        <a
                          href={seg.webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--info)',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <ExternalLink size={11} /> Open in Outlook
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
