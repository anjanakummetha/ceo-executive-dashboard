'use client';

import { useState } from 'react';
import { Mail, Flag, ExternalLink } from 'lucide-react';
import { emails, type Email } from '@/lib/data';

const priorityDot = {
  critical: '#e05252',
  high: '#e09a44',
  medium: '#c9a044',
  low: '#4caf82',
};

export default function EmailPanel() {
  const [items, setItems] = useState<Email[]>(emails);
  const [filter, setFilter] = useState<'all' | 'unread' | 'flagged'>('all');

  const toggleFlag = (id: string) =>
    setItems(prev => prev.map(e => e.id === id ? { ...e, flagged: !e.flagged } : e));

  const markRead = (id: string) =>
    setItems(prev => prev.map(e => e.id === id ? { ...e, unread: false } : e));

  const filtered = items.filter(e => {
    if (filter === 'unread') return e.unread;
    if (filter === 'flagged') return e.flagged;
    return true;
  });

  const unreadCount = items.filter(e => e.unread).length;

  return (
    <div className="card flex flex-col" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="section-header mb-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}
            >
              <Mail size={13} style={{ color: '#c9a044' }} />
            </div>
            <span className="section-title">Inbox</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="badge-danger">{unreadCount} Unread</span>
            )}
            <button
              style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '4px 8px', color: '#c9a044', fontSize: 11, cursor: 'pointer' }}
              title="Open email client"
            >
              <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'unread', 'flagged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(201,160,68,0.2)' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(201,160,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6,
                padding: '3px 10px',
                color: filter === f ? '#c9a044' : '#888',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Email list */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: '380px' }}>
        {filtered.map((email, idx) => (
          <div
            key={email.id}
            onClick={() => markRead(email.id)}
            style={{
              borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: email.unread ? 'rgba(201,160,68,0.04)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            className="px-4 py-3 hover:bg-white/5"
          >
            <div className="flex items-start gap-3">
              {/* Unread indicator */}
              <div className="flex flex-col items-center gap-1.5 pt-1 flex-shrink-0">
                {email.unread ? (
                  <div className="unread-dot" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-transparent border border-transparent" />
                )}
              </div>

              {/* Avatar */}
              <div
                className="avatar text-[#2a2a2a] flex-shrink-0"
                style={{ background: email.senderColor, fontSize: '11px' }}
              >
                {email.senderInitials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    style={{ color: email.unread ? '#ffffff' : '#d0d0d0', fontSize: '13px', fontWeight: email.unread ? 600 : 400 }}
                    className="truncate"
                  >
                    {email.sender}
                  </span>
                  <span style={{ color: '#666', fontSize: '11px', flexShrink: 0 }}>{email.time}</span>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: priorityDot[email.priority] }}
                    title={email.priority}
                  />
                  <p
                    style={{ color: email.unread ? '#e0e0e0' : '#aaa', fontSize: '12px', fontWeight: email.unread ? 600 : 400 }}
                    className="truncate"
                  >
                    {email.subject}
                  </p>
                </div>

                <p style={{ color: '#777', fontSize: '11px' }} className="truncate">
                  {email.preview}
                </p>

                {/* Labels */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {email.labels.map(label => (
                    <span
                      key={label}
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontSize: '10px',
                        color: '#888',
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Flag button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFlag(email.id); }}
                className="flag-btn flex-shrink-0 mt-0.5"
              >
                <Flag
                  size={12}
                  fill={email.flagged ? '#c9a044' : 'none'}
                  style={{ color: email.flagged ? '#c9a044' : '#555' }}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(201,160,68,0.15)' }}
      >
        <span style={{ color: '#666', fontSize: '11px' }}>{items.length} total messages</span>
        <button
          style={{ color: '#c9a044', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
        >
          Open Gmail →
        </button>
      </div>
    </div>
  );
}
