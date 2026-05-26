'use client';

import { useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Flag, CheckCircle2, MessageSquare } from 'lucide-react';
import { calls, type Call } from '@/lib/data';

const typeConfig = {
  'follow-up': { icon: PhoneOutgoing, color: '#c9a044', label: 'Follow-up' },
  scheduled: { icon: Phone, color: '#4a9ed6', label: 'Scheduled' },
  incoming: { icon: PhoneIncoming, color: '#4caf82', label: 'Incoming' },
  outgoing: { icon: PhoneOutgoing, color: '#9b59b6', label: 'Outgoing' },
};

export default function CallsPanel() {
  const [items, setItems] = useState<Call[]>(calls);

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(c => c.id === id ? { ...c, flagged: !c.flagged } : c));

  const toggleComplete = (id: string) =>
    setItems(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));

  const missedCalls = items.filter(c => c.type === 'incoming' && !c.completed);
  const pendingCount = items.filter(c => !c.completed).length;

  return (
    <div className="card flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="section-header mb-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}
            >
              <Phone size={13} style={{ color: '#c9a044' }} />
            </div>
            <span className="section-title">Calls &amp; Follow-ups</span>
          </div>
          <div className="flex items-center gap-2">
            {missedCalls.length > 0 && (
              <span className="badge-danger">{missedCalls.length} Missed</span>
            )}
            <span className="badge-gold">{pendingCount} Pending</span>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
        {items.map((call, idx) => {
          const { icon: Icon, color, label } = typeConfig[call.type];
          return (
            <div
              key={call.id}
              style={{
                borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                background: call.flagged ? 'rgba(201,160,68,0.04)' : 'transparent',
                opacity: call.completed ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
              className="px-4 py-3"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="avatar text-[#2a2a2a] flex-shrink-0"
                  style={{ background: call.contactColor, fontSize: '11px' }}
                >
                  {call.contactInitials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }}>
                          {call.contact}
                        </span>
                        {call.type === 'incoming' && (
                          <span className="badge-danger" style={{ fontSize: '9px', padding: '1px 5px' }}>Missed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Icon size={10} style={{ color, flexShrink: 0 }} />
                        <span style={{ color, fontSize: '10px', fontWeight: 600 }}>{label}</span>
                        <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                        <span style={{ color: '#888', fontSize: '10px' }}>{call.role}</span>
                        <span style={{ color: '#555', fontSize: '10px' }}>·</span>
                        <span style={{ color: '#888', fontSize: '10px' }}>{call.company}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleFlag(call.id)} className="flag-btn">
                        <Flag size={11} fill={call.flagged ? '#c9a044' : 'none'} style={{ color: call.flagged ? '#c9a044' : '#555' }} />
                      </button>
                      <button onClick={() => toggleComplete(call.id)} className="flag-btn">
                        <CheckCircle2 size={11} fill={call.completed ? '#4caf82' : 'none'} style={{ color: call.completed ? '#4caf82' : '#555' }} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span style={{ color: '#666', fontSize: '11px' }}>{call.time}</span>
                    {call.duration && (
                      <>
                        <span style={{ color: '#444', fontSize: '10px' }}>·</span>
                        <span style={{ color: '#666', fontSize: '11px' }}>{call.duration}</span>
                      </>
                    )}
                  </div>

                  <p
                    style={{
                      color: '#888',
                      fontSize: '11px',
                      lineHeight: 1.4,
                      marginTop: '4px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      borderLeft: `2px solid ${color}`,
                    }}
                  >
                    {call.notes}
                  </p>

                  {/* Action buttons */}
                  {!call.completed && (
                    <div className="flex gap-2 mt-2">
                      <button
                        style={{
                          background: 'rgba(76,175,130,0.12)',
                          border: '1px solid rgba(76,175,130,0.3)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          color: '#4caf82',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Phone size={9} />
                        {call.type === 'incoming' ? 'Call Back' : 'Call Now'}
                      </button>
                      <button
                        style={{
                          background: 'rgba(74,158,214,0.12)',
                          border: '1px solid rgba(74,158,214,0.3)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          color: '#4a9ed6',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MessageSquare size={9} />
                        Note
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
  );
}
