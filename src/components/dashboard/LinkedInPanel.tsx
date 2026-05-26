'use client';

import { useState } from 'react';
import { Flag, ExternalLink } from 'lucide-react';
import { linkedInMessages, type LinkedInMessage } from '@/lib/data';

export default function LinkedInPanel() {
  const [items, setItems] = useState<LinkedInMessage[]>(linkedInMessages);

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(m => m.id === id ? { ...m, flagged: !m.flagged } : m));

  const markRead = (id: string) =>
    setItems(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));

  const unreadCount = items.filter(m => m.unread).length;

  return (
    <div className="card flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="section-header mb-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(10,102,194,0.2)', border: '1px solid rgba(10,102,194,0.4)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#0a66c2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </div>
            <span className="section-title">LinkedIn</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && <span className="badge-gold">{unreadCount} New</span>}
            <button
              style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '4px 8px', color: '#c9a044', fontSize: 11, cursor: 'pointer' }}
            >
              <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
        {items.map((msg, idx) => (
          <div
            key={msg.id}
            onClick={() => markRead(msg.id)}
            style={{
              borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: msg.unread ? 'rgba(10,102,194,0.06)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            className="px-4 py-3 hover:bg-white/5"
          >
            <div className="flex items-start gap-3">
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1.5">
                {msg.unread ? (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                ) : (
                  <div className="w-2 h-2" />
                )}
              </div>

              {/* Avatar */}
              <div
                className="avatar text-[#2a2a2a] flex-shrink-0"
                style={{ background: msg.senderColor, fontSize: '11px' }}
              >
                {msg.senderInitials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{ color: msg.unread ? '#fff' : '#d0d0d0', fontSize: '13px', fontWeight: msg.unread ? 600 : 400 }}
                    >
                      {msg.sender}
                    </span>
                    <span
                      style={{
                        background: 'rgba(10,102,194,0.15)',
                        color: '#4a9ed6',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        border: '1px solid rgba(10,102,194,0.3)',
                      }}
                    >
                      {msg.connectionDegree}st
                    </span>
                  </div>
                  <span style={{ color: '#666', fontSize: '10px', flexShrink: 0 }}>{msg.time}</span>
                </div>

                <p style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                  {msg.role} · {msg.company}
                </p>
                <p
                  style={{
                    color: msg.unread ? '#bbb' : '#888',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    marginTop: '5px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {msg.preview}
                </p>
              </div>

              <button onClick={(e) => { e.stopPropagation(); toggleFlag(msg.id); }} className="flag-btn flex-shrink-0">
                <Flag size={11} fill={msg.flagged ? '#c9a044' : 'none'} style={{ color: msg.flagged ? '#c9a044' : '#555' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(201,160,68,0.15)' }}
      >
        <span style={{ color: '#666', fontSize: '11px' }}>{items.length} messages</span>
        <button style={{ color: '#0a66c2', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
          Open LinkedIn →
        </button>
      </div>
    </div>
  );
}
