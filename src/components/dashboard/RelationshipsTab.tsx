'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { Users, MessageSquare, Clock, TrendingDown, TrendingUp, Minus, AlertTriangle, DollarSign, Copy, CheckCircle2, Calendar } from 'lucide-react';
import { relationshipContacts, meetings, type RelationshipContact, type RelationshipHealth } from '@/lib/data';

const healthConfig: Record<RelationshipHealth, { color: string; bg: string; border: string; label: string; icon: ElementType }> = {
  strong:  { color: '#4caf82', bg: 'rgba(76,175,130,0.1)',  border: 'rgba(76,175,130,0.25)',  label: 'Strong',  icon: TrendingUp },
  good:    { color: '#4a9ed6', bg: 'rgba(74,158,214,0.1)',  border: 'rgba(74,158,214,0.25)',  label: 'Good',    icon: Minus },
  cooling: { color: '#e09a44', bg: 'rgba(224,154,68,0.1)',  border: 'rgba(224,154,68,0.25)',  label: 'Cooling', icon: TrendingDown },
  cold:    { color: '#e05252', bg: 'rgba(224,82,82,0.1)',   border: 'rgba(224,82,82,0.25)',   label: 'Cold',    icon: AlertTriangle },
};

function HealthRing({ score, color, size = 44 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color }}>
        {score}
      </div>
    </div>
  );
}

function ContactCard({ contact }: { contact: RelationshipContact }) {
  const [msgCopied, setMsgCopied] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const hc = healthConfig[contact.health];
  const HealthIcon = hc.icon;
  const needsAction = contact.health === 'cold' || contact.health === 'cooling';

  const copyMessage = () => {
    if (contact.suggestedMessage) {
      navigator.clipboard.writeText(contact.suggestedMessage).catch(() => {});
      setMsgCopied(true);
      setTimeout(() => setMsgCopied(false), 2000);
    }
  };

  return (
    <div style={{ background: '#333333', border: `1px solid ${needsAction ? hc.border : 'rgba(255,255,255,0.07)'}`, borderTop: `2px solid ${hc.color}`, borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s' }} className="card-hover">
      <div style={{ padding: '14px' }}>
        <div className="flex items-start gap-3 mb-3">
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: contact.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#1a1a1a', flexShrink: 0, border: `2px solid ${hc.color}30` }}>
            {contact.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p style={{ color: '#f0f0f0', fontSize: '14px', fontWeight: 700 }}>{contact.name}</p>
                <p style={{ color: '#999', fontSize: '11px' }}>{contact.role}</p>
                <p style={{ color: '#666', fontSize: '10px' }}>{contact.company}</p>
              </div>
              <HealthRing score={contact.healthScore} color={hc.color} />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.tags.map(tag => (
                <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 4, padding: '1px 6px', fontSize: '9px', color: '#888', fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: hc.bg, border: `1px solid ${hc.border}`, borderRadius: 7, marginBottom: 10 }}>
          <HealthIcon size={11} style={{ color: hc.color, flexShrink: 0 }} />
          <span style={{ color: hc.color, fontSize: '10px', fontWeight: 700 }}>{hc.label}</span>
          <span style={{ color: '#555', fontSize: '10px' }}>·</span>
          <Clock size={9} style={{ color: '#666' }} />
          <span style={{ color: contact.health === 'cold' ? '#e05252' : '#888', fontSize: '10px', fontWeight: contact.daysSince > 30 ? 700 : 400 }}>
            Last contact {contact.lastContact}
          </span>
          {contact.dealValue && (
            <>
              <span style={{ color: '#444', marginLeft: 'auto', fontSize: '10px' }}>·</span>
              <DollarSign size={9} style={{ color: '#4caf82' }} />
              <span style={{ color: '#4caf82', fontSize: '10px', fontWeight: 700 }}>{contact.dealValue}</span>
            </>
          )}
        </div>

        <div style={{ background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.15)', borderRadius: 8, padding: '9px 10px', marginBottom: contact.suggestedMessage ? 10 : 0 }}>
          <p style={{ color: '#777', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>AI Insight</p>
          <p style={{ color: '#c0b880', fontSize: '11px', lineHeight: 1.5 }}>{contact.aiInsight}</p>
        </div>

        {contact.historicalNote && (
          <p style={{ color: '#666', fontSize: '10px', lineHeight: 1.4, marginTop: 8, fontStyle: 'italic', paddingLeft: 6, borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
            {contact.historicalNote}
          </p>
        )}

        {contact.suggestedMessage && (
          <div style={{ marginTop: 10 }}>
            <button onClick={() => setShowMsg(!showMsg)} style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.22)', borderRadius: 7, padding: '5px 10px', color: '#c9a044', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, width: '100%', justifyContent: 'center' }}>
              <MessageSquare size={11} />
              {showMsg ? 'Hide' : 'View'} AI-Drafted Reconnect Message
            </button>
            {showMsg && (
              <div style={{ marginTop: 8, background: 'rgba(201,160,68,0.05)', border: '1px solid rgba(201,160,68,0.18)', borderRadius: 8, padding: '10px 12px' }} className="slide-in">
                <p style={{ color: '#d4c080', fontSize: '12px', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{contact.suggestedMessage}&rdquo;</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={copyMessage} style={{ background: msgCopied ? 'rgba(76,175,130,0.12)' : 'rgba(201,160,68,0.12)', border: `1px solid ${msgCopied ? 'rgba(76,175,130,0.28)' : 'rgba(201,160,68,0.28)'}`, borderRadius: 6, padding: '4px 10px', color: msgCopied ? '#4caf82' : '#c9a044', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {msgCopied ? <><CheckCircle2 size={10} />Copied!</> : <><Copy size={10} />Copy</>}
                  </button>
                  <button style={{ background: 'rgba(74,158,214,0.1)', border: '1px solid rgba(74,158,214,0.25)', borderRadius: 6, padding: '4px 10px', color: '#4a9ed6', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                    Send via LinkedIn
                  </button>
                  <button style={{ background: 'rgba(201,160,68,0.08)', border: '1px solid rgba(201,160,68,0.22)', borderRadius: 6, padding: '4px 10px', color: '#c9a044', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                    Send via Email
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RelationshipsTab() {
  const [filter, setFilter] = useState<'all' | RelationshipHealth | 'critical'>('all');

  const filtered = relationshipContacts.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'critical') return c.importance === 'critical';
    return c.health === filter;
  });

  const coldCount = relationshipContacts.filter(c => c.health === 'cold').length;
  const coolingCount = relationshipContacts.filter(c => c.health === 'cooling').length;
  const strongCount = relationshipContacts.filter(c => c.health === 'strong' || c.health === 'good').length;
  const avgHealth = Math.round(relationshipContacts.reduce((s, c) => s + c.healthScore, 0) / relationshipContacts.length);

  // Cross-reference meeting attendees with relationship contacts
  const meetingContactIds = new Set(
    meetings.flatMap(m => m.attendees.map(a => a.name))
  );
  const meetingRelContacts = relationshipContacts.filter(c => meetingContactIds.has(c.name));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* ── Today's Meeting People ── */}
      {meetings.length > 0 && (
        <div style={{ background: '#2e2e2e', border: '1px solid rgba(201,160,68,0.22)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Calendar size={14} style={{ color: '#c9a044' }} />
            </div>
            <div>
              <div style={{ color: '#c9a044', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Today&apos;s Meeting People</div>
              <div style={{ color: '#777', fontSize: '11px' }}>Bios &amp; context for everyone on your schedule today</div>
            </div>
          </div>

          <div style={{ padding: '16px 20px' }}>
            <div className="space-y-5">
              {meetings.map(meeting => (
                <div key={meeting.id}>
                  {/* Meeting header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c9a044', flexShrink: 0 }} />
                    <span style={{ color: '#c9a044', fontSize: '12px', fontWeight: 700 }}>{meeting.time}</span>
                    <span style={{ color: '#555' }}>—</span>
                    <span style={{ color: '#d0d0d0', fontSize: '13px', fontWeight: 600 }}>{meeting.title}</span>
                    <span style={{ color: '#666', fontSize: '11px' }}>({meeting.duration})</span>
                  </div>

                  {/* Attendees */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 ml-4">
                    {meeting.attendees.map(attendee => {
                      const relContact = relationshipContacts.find(c => c.name === attendee.name);
                      const hc = relContact ? healthConfig[relContact.health] : null;
                      return (
                        <div key={attendee.name} style={{ background: '#333333', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '13px 14px' }}>
                          <div className="flex items-start gap-3 mb-2">
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: attendee.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#1a1a1a', flexShrink: 0, border: `2px solid ${hc ? hc.color + '40' : 'rgba(201,160,68,0.2)'}` }}>
                              {attendee.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <p style={{ color: '#f0f0f0', fontSize: '13px', fontWeight: 700 }}>{attendee.name}</p>
                                  <p style={{ color: '#888', fontSize: '11px' }}>{attendee.role}</p>
                                  <p style={{ color: '#666', fontSize: '10px' }}>{attendee.company}</p>
                                </div>
                                {hc && (
                                  <span style={{ background: hc.bg, color: hc.color, border: `1px solid ${hc.border}`, borderRadius: 5, padding: '1px 6px', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>
                                    {hc.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {attendee.bio && (
                            <p style={{ color: '#aaa', fontSize: '12px', lineHeight: 1.55, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              {attendee.bio}
                            </p>
                          )}
                          {relContact?.aiInsight && (
                            <div style={{ marginTop: 8, background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.14)', borderRadius: 6, padding: '6px 8px' }}>
                              <p style={{ color: '#777', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Relationship Note</p>
                              <p style={{ color: '#c0b060', fontSize: '11px', lineHeight: 1.5 }}>{relContact.aiInsight}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Network Health Summary ── */}
      <div style={{ background: '#2e2e2e', border: '1px solid rgba(201,160,68,0.18)', borderRadius: 14, padding: '16px 20px' }}>
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={14} style={{ color: '#c9a044' }} />
          </div>
          <div>
            <div style={{ color: '#c9a044', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Network Intelligence</div>
            <div style={{ color: '#777', fontSize: '12px' }}>Tracking {relationshipContacts.length} key relationships — {coldCount + coolingCount} need attention</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Network Health', value: `${avgHealth}`, suffix: '/100', color: avgHealth > 60 ? '#4caf82' : '#e09a44' },
            { label: 'Strong / Good', value: `${strongCount}`, suffix: ' contacts', color: '#4caf82' },
            { label: 'Cooling', value: `${coolingCount}`, suffix: ' contacts', color: '#e09a44' },
            { label: 'Cold / At Risk', value: `${coldCount}`, suffix: ' contacts', color: '#e05252' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ color: stat.color, fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{stat.value}<span style={{ fontSize: '11px', fontWeight: 400, color: '#666' }}>{stat.suffix}</span></div>
              <div style={{ color: '#777', fontSize: '10px', marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'all', label: 'All Relationships' },
          { key: 'critical', label: 'Critical Only' },
          { key: 'cold', label: 'Cold' },
          { key: 'cooling', label: 'Cooling' },
          { key: 'good', label: 'Good' },
          { key: 'strong', label: 'Strong' },
        ] as const).map(({ key, label }) => {
          const healthColors: Record<string, string> = { cold: '#e05252', cooling: '#e09a44', good: '#4a9ed6', strong: '#4caf82' };
          const c = healthColors[key] || '#c9a044';
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{ background: filter === key ? 'rgba(201,160,68,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === key ? 'rgba(201,160,68,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, padding: '5px 14px', color: filter === key ? '#c9a044' : '#777', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {key !== 'all' && key !== 'critical' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: c, marginRight: 5, verticalAlign: 'middle' }} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Contacts grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </div>

      {/* Meeting contacts highlight */}
      {meetingRelContacts.length > 0 && filter === 'all' && (
        <div style={{ background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.18)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={12} style={{ color: '#c9a044' }} />
          <p style={{ color: '#c9a044', fontSize: '11px', fontWeight: 600 }}>
            {meetingRelContacts.map(c => c.name).join(', ')} {meetingRelContacts.length === 1 ? 'is' : 'are'} in your network and have meetings today
          </p>
        </div>
      )}
    </div>
  );
}
