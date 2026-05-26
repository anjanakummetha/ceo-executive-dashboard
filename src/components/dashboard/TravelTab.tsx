'use client';

import { useState } from 'react';
import { Plane, Hotel, Car, Train, Utensils, Star, Flag, AlertTriangle, MapPin, Clock, Hash } from 'lucide-react';
import { travelSegments, type TravelSegment } from '@/lib/data';

const typeConfig = {
  flight:     { icon: Plane,    color: '#4a9ed6', bg: 'rgba(74,158,214,0.15)',    label: 'Flight' },
  hotel:      { icon: Hotel,    color: '#c9a044', bg: 'rgba(201,160,68,0.15)',    label: 'Hotel' },
  car:        { icon: Car,      color: '#27ae60', bg: 'rgba(39,174,96,0.15)',     label: 'Car Service' },
  train:      { icon: Train,    color: '#9b59b6', bg: 'rgba(155,89,182,0.15)',    label: 'Train' },
  restaurant: { icon: Utensils, color: '#e09a44', bg: 'rgba(224,154,68,0.15)',   label: 'Dining' },
  other:      { icon: Star,     color: '#e05252', bg: 'rgba(224,82,82,0.15)',     label: 'Event' },
};

const statusConfig = {
  confirmed:   { color: '#4caf82', bg: 'rgba(76,175,130,0.12)',  label: 'CONFIRMED' },
  pending:     { color: '#e09a44', bg: 'rgba(224,154,68,0.12)',  label: 'PENDING' },
  'checked-in':{ color: '#4a9ed6', bg: 'rgba(74,158,214,0.12)', label: 'CHECKED IN' },
  completed:   { color: '#666',    bg: 'rgba(100,100,100,0.12)', label: 'COMPLETED' },
};

const groupByDate = (segments: TravelSegment[]) => {
  return segments.reduce((acc, seg) => {
    if (!acc[seg.date]) acc[seg.date] = [];
    acc[seg.date].push(seg);
    return acc;
  }, {} as Record<string, TravelSegment[]>);
};

export default function TravelTab() {
  const [items, setItems] = useState<TravelSegment[]>(travelSegments);

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(s => s.id === id ? { ...s, flagged: !s.flagged } : s));

  const groups = groupByDate(items);
  const urgentCount = items.filter(s => s.flagged).length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
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
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(74,158,214,0.2)', border: '1px solid rgba(74,158,214,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={18} style={{ color: '#4a9ed6' }} />
          </div>
          <div>
            <div style={{ color: '#4a9ed6', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Upcoming Trip</div>
            <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>SaaStr Annual Conference</div>
            <div style={{ color: '#888', fontSize: '12px' }}>City A → City B · Thu May 28 – Sat May 30</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#c9a044', fontSize: '18px', fontWeight: 700 }}>{items.length}</div>
            <div style={{ color: '#666', fontSize: '10px' }}>Segments</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4caf82', fontSize: '18px', fontWeight: 700 }}>{items.filter(s => s.status === 'confirmed').length}</div>
            <div style={{ color: '#666', fontSize: '10px' }}>Confirmed</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
          {urgentCount > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#e05252', fontSize: '18px', fontWeight: 700 }}>{urgentCount}</div>
              <div style={{ color: '#666', fontSize: '10px' }}>Action Needed</div>
            </div>
          )}
        </div>
      </div>

      {/* Urgent flags */}
      {items.filter(s => s.flagged).length > 0 && (
        <div
          style={{
            background: 'rgba(224,82,82,0.07)',
            border: '1px solid rgba(224,82,82,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} style={{ color: '#e05252' }} />
            <span style={{ color: '#e05252', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Action Required</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {items.filter(s => s.flagged).map(seg => {
              const tc = typeConfig[seg.type];
              const Icon = tc.icon;
              return (
                <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={12} style={{ color: tc.color }} />
                  <span style={{ color: '#e0d0d0', fontSize: '12px' }}>{seg.title}</span>
                  <span style={{ color: '#888', fontSize: '11px' }}>· {seg.date} at {seg.time}</span>
                  {seg.notes && <span style={{ color: '#e09a44', fontSize: '11px', fontStyle: 'italic', marginLeft: 4 }}>→ {seg.notes.split('.')[0]}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day-by-day itinerary */}
      {Object.entries(groups).map(([date, segs]) => (
        <div key={date}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(201,160,68,0.2)' }} />
            <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{date}</span>
            <div style={{ height: 1, flex: 1, background: 'rgba(201,160,68,0.2)' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {segs.map(seg => {
              const tc = typeConfig[seg.type];
              const sc = statusConfig[seg.status];
              const Icon = tc.icon;
              return (
                <div
                  key={seg.id}
                  style={{
                    background: '#2e2e2e',
                    border: `1px solid ${seg.flagged ? 'rgba(201,160,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    borderTop: `3px solid ${tc.color}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                  className="card-hover"
                >
                  {/* Card header */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={15} style={{ color: tc.color }} />
                        </div>
                        <div>
                          <span style={{ background: `${tc.color}20`, color: tc.color, fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.5px' }}>
                            {tc.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ background: sc.bg, color: sc.color, fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4, border: `1px solid ${sc.color}30` }}>
                          {sc.label}
                        </span>
                        <button onClick={() => toggleFlag(seg.id)} className="flag-btn">
                          <Flag size={12} fill={seg.flagged ? '#c9a044' : 'none'} style={{ color: seg.flagged ? '#c9a044' : '#555' }} />
                        </button>
                      </div>
                    </div>
                    <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600, marginTop: 8, lineHeight: 1.3 }}>{seg.title}</p>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '10px 14px' }} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={11} style={{ color: '#888', flexShrink: 0 }} />
                      <span style={{ color: '#c0c0c0', fontSize: '12px' }}>
                        {seg.time}{seg.endTime ? ` → ${seg.endTime}` : ''}
                      </span>
                    </div>
                    {seg.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={11} style={{ color: '#888', flexShrink: 0 }} />
                        <span style={{ color: '#c0c0c0', fontSize: '12px' }}>{seg.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Hash size={11} style={{ color: '#888', flexShrink: 0 }} />
                      <span style={{ color: '#888', fontSize: '11px' }}>
                        {seg.confirmationCode}
                        {seg.provider && <span style={{ color: '#666' }}> · {seg.provider}</span>}
                      </span>
                    </div>
                    <p style={{ color: '#999', fontSize: '11px', lineHeight: 1.4 }}>{seg.details}</p>
                    {seg.notes && (
                      <div style={{ background: seg.flagged ? 'rgba(201,160,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${seg.flagged ? 'rgba(201,160,68,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, padding: '6px 8px' }}>
                        <p style={{ color: seg.flagged ? '#d4af60' : '#888', fontSize: '11px', lineHeight: 1.4 }}>
                          {seg.flagged && '⚠ '}{seg.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
