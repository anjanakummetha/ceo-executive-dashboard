'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, Clock, TrendingDown, TrendingUp, Minus, AlertTriangle, DollarSign, Copy, CheckCircle2 } from 'lucide-react';
import { relationshipContacts, type RelationshipContact, type RelationshipHealth } from '@/lib/data';

const healthConfig: Record<RelationshipHealth, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  strong:  { color: '#4caf82', bg: 'rgba(76,175,130,0.12)',  border: 'rgba(76,175,130,0.3)',  label: 'Strong',  icon: TrendingUp },
  good:    { color: '#4a9ed6', bg: 'rgba(74,158,214,0.12)',  border: 'rgba(74,158,214,0.3)',  label: 'Good',    icon: Minus },
  cooling: { color: '#e09a44', bg: 'rgba(224,154,68,0.12)',  border: 'rgba(224,154,68,0.3)',  label: 'Cooling', icon: TrendingDown },
  cold:    { color: '#e05252', bg: 'rgba(224,82,82,0.12)',   border: 'rgba(224,82,82,0.3)',   label: 'Cold',    icon: AlertTriangle },
};


function HealthRing({ score, color, size = 48 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color }}>
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
    <div
      style={{
        background: '#3d3d3d',
        border: `1px solid ${needsAction ? hc.border : 'rgba(255,255,255,0.08)'}`,
        borderTop: `3px solid ${hc.color}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
      className="card-hover"
    >
      {/* Card header */}
      <div style={{ padding: '14px 14px 10px' }}>
        <div className="flex items-start gap-3">
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: contact.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#1a1a1a', flexShrink: 0, border: `2px solid ${hc.color}40` }}>
            {contact.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p style={{ color: '#f0f0f0', fontSize: '14px', fontWeight: 700 }}>{contact.name}</p>
                <p style={{ color: '#888', fontSize: '11px' }}>{contact.role}</p>
                <p style={{ color: '#666', fontSize: '10px' }}>{contact.company}</p>
              </div>
              <HealthRing score={contact.healthScore} color={hc.color} size={44} />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.tags.map(tag => (
                <span key={tag} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 6px', fontSize: '9px', color: '#888', fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 8px', background: hc.bg, border: `1px solid ${hc.border}`, borderRadius: 7 }}>
          <HealthIcon size={12} style={{ color: hc.color, flexShrink: 0 }} />
          <span style={{ color: hc.color, fontSize: '10px', fontWeight: 700 }}>{hc.label}</span>
          <span style={{ color: '#555', fontSize: '10px' }}>·</span>
          <Clock size={9} style={{ color: '#666' }} />
          <span style={{ color: contact.health === 'cold' ? '#e05252' : '#888', fontSize: '10px', fontWeight: contact.daysSince > 30 ? 700 : 400 }}>
            Last contact {contact.lastContact}
          </span>
          {contact.dealValue && (
            <>
              <span style={{ color: '#444', fontSize: '10px', marginLeft: 'auto' }}>·</span>
              <DollarSign size={9} style={{ color: '#4caf82' }} />
              <span style={{ color: '#4caf82', fontSize: '10px', fontWeight: 700 }}>{contact.dealValue}</span>
            </>
          )}
        </div>
      </div>

      {/* AI Insight */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 8, padding: '9px 10px' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={10} style={{ color: '#8b5cf6' }} />
            <span style={{ color: '#a78bfa', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>AI Insight</span>
          </div>
          <p style={{ color: '#c0b8e0', fontSize: '11px', lineHeight: 1.5 }}>{contact.aiInsight}</p>
        </div>

        {/* Historical note */}
        {contact.historicalNote && (
          <p style={{ color: '#666', fontSize: '10px', lineHeight: 1.4, marginTop: 6, fontStyle: 'italic', paddingLeft: 6, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
            {contact.historicalNote}
          </p>
        )}

        {/* Suggested message */}
        {contact.suggestedMessage && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setShowMsg(!showMsg)}
              style={{ background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 7, padding: '5px 10px', color: '#c9a044', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, width: '100%', justifyContent: 'center' }}
            >
              <MessageSquare size={11} />
              {showMsg ? 'Hide' : 'View'} AI-Drafted Reconnect Message
            </button>

            {showMsg && (
              <div style={{ marginTop: 8, background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.2)', borderRadius: 8, padding: '10px 12px' }} className="slide-in">
                <p style={{ color: '#d4c080', fontSize: '12px', lineHeight: 1.6, fontStyle: 'italic' }}>
                  &ldquo;{contact.suggestedMessage}&rdquo;
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={copyMessage}
                    style={{ background: msgCopied ? 'rgba(76,175,130,0.15)' : 'rgba(201,160,68,0.15)', border: `1px solid ${msgCopied ? 'rgba(76,175,130,0.3)' : 'rgba(201,160,68,0.3)'}`, borderRadius: 6, padding: '4px 10px', color: msgCopied ? '#4caf82' : '#c9a044', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {msgCopied ? <><CheckCircle2 size={10} />Copied!</> : <><Copy size={10} />Copy</>}
                  </button>
                  <button style={{ background: 'rgba(74,158,214,0.12)', border: '1px solid rgba(74,158,214,0.3)', borderRadius: 6, padding: '4px 10px', color: '#4a9ed6', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                    Send via LinkedIn
                  </button>
                  <button style={{ background: 'rgba(155,89,182,0.12)', border: '1px solid rgba(155,89,182,0.3)', borderRadius: 6, padding: '4px 10px', color: '#9b59b6', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
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

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(18,18,28,0.98) 0%, rgba(32,28,48,0.98) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 12,
          padding: '16px 20px',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <div style={{ color: '#a78bfa', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>AI Relationship Intelligence</div>
            <div style={{ color: '#d8d0f4', fontSize: '13px', fontWeight: 600 }}>Tracking {relationshipContacts.length} key relationships — {coldCount + coolingCount} need attention</div>
          </div>
        </div>

        {/* Health overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Network Health', value: `${avgHealth}`, suffix: '/100', color: avgHealth > 60 ? '#4caf82' : '#e09a44' },
            { label: 'Strong / Good', value: `${strongCount}`, suffix: ` contacts`, color: '#4caf82' },
            { label: 'Cooling', value: `${coolingCount}`, suffix: ` contacts`, color: '#e09a44' },
            { label: 'Cold / At Risk', value: `${coldCount}`, suffix: ` contacts`, color: '#e05252' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ color: stat.color, fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{stat.value}<span style={{ fontSize: '11px', fontWeight: 400, color: '#666' }}>{stat.suffix}</span></div>
              <div style={{ color: '#777', fontSize: '10px', marginTop: 3, fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'All Relationships' },
          { key: 'critical', label: '⚡ Critical Only' },
          { key: 'cold', label: '🔴 Cold' },
          { key: 'cooling', label: '🟡 Cooling' },
          { key: 'good', label: '🔵 Good' },
          { key: 'strong', label: '🟢 Strong' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              background: filter === key ? 'rgba(201,160,68,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filter === key ? 'rgba(201,160,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20,
              padding: '5px 14px',
              color: filter === key ? '#c9a044' : '#888',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contacts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </div>
    </div>
  );
}
