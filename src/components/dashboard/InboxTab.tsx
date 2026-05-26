'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { Mail, Flag, ExternalLink, Sparkles, AlertCircle, Users, DollarSign, Heart, Megaphone, Scale, TrendingUp, ArrowRight, Copy, CheckCircle2, UserMinus } from 'lucide-react';
import { emails, linkedInMessages, type Email, type EmailCategory, type EmailTriage } from '@/lib/data';

const categoryConfig: Record<EmailCategory, { label: string; color: string; bg: string; border: string; icon: ElementType }> = {
  urgent:   { label: 'Urgent',    color: '#e05252', bg: 'rgba(224,82,82,0.12)',    border: 'rgba(224,82,82,0.35)',    icon: AlertCircle },
  board:    { label: 'Board',     color: '#9b59b6', bg: 'rgba(155,89,182,0.12)',   border: 'rgba(155,89,182,0.35)',   icon: Users },
  finance:  { label: 'Finance',   color: '#4caf82', bg: 'rgba(76,175,130,0.12)',   border: 'rgba(76,175,130,0.35)',   icon: DollarSign },
  personal: { label: 'Personal',  color: '#c9a044', bg: 'rgba(201,160,68,0.12)',   border: 'rgba(201,160,68,0.35)',   icon: Heart },
  pr:       { label: 'PR/Media',  color: '#e09a44', bg: 'rgba(224,154,68,0.12)',   border: 'rgba(224,154,68,0.35)',   icon: Megaphone },
  legal:    { label: 'Legal',     color: '#4a9ed6', bg: 'rgba(74,158,214,0.12)',   border: 'rgba(74,158,214,0.35)',   icon: Scale },
  team:     { label: 'Team',      color: '#27ae60', bg: 'rgba(39,174,96,0.12)',    border: 'rgba(39,174,96,0.35)',    icon: Users },
  sales:    { label: 'Sales',     color: '#d4af60', bg: 'rgba(212,175,96,0.12)',   border: 'rgba(212,175,96,0.35)',   icon: TrendingUp },
};

const triageConfig: Record<EmailTriage, { label: string; color: string; bg: string }> = {
  'urgent-reply':        { label: 'Urgent Reply',     color: '#e05252', bg: 'rgba(224,82,82,0.15)' },
  'revenue':             { label: 'Revenue',          color: '#4caf82', bg: 'rgba(76,175,130,0.15)' },
  'emotionally-sensitive':{ label: 'Sensitive',       color: '#9b59b6', bg: 'rgba(155,89,182,0.15)' },
  'delegate':            { label: 'Delegate',         color: '#888',    bg: 'rgba(136,136,136,0.15)' },
  'quick-reply':         { label: 'Quick Reply',      color: '#4a9ed6', bg: 'rgba(74,158,214,0.15)' },
  'deep-response':       { label: 'Deep Response',    color: '#c9a044', bg: 'rgba(201,160,68,0.15)' },
  'ignore':              { label: 'Can Ignore',       color: '#555',    bg: 'rgba(80,80,80,0.15)' },
  'fyi':                 { label: 'FYI Only',         color: '#666',    bg: 'rgba(100,100,100,0.15)' },
};

function sentimentBar(score: number) {
  const color = score > 0.3 ? '#4caf82' : score < -0.3 ? '#e05252' : '#c9a044';
  const label = score > 0.3 ? 'Positive' : score < -0.3 ? 'Negative' : 'Neutral';
  const pct = ((score + 1) / 2) * 100;
  return { color, label, pct };
}

type FilterType = 'all' | 'unread' | 'flagged' | EmailCategory;

export default function InboxTab() {
  const [emailItems, setEmailItems] = useState<Email[]>(emails);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedId, setSelectedId] = useState<string | null>('e1');
  const [linkedInItems, setLinkedInItems] = useState(linkedInMessages);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const toggleEmailFlag = (id: string) => setEmailItems(p => p.map(e => e.id === id ? { ...e, flagged: !e.flagged } : e));
  const markRead = (id: string) => setEmailItems(p => p.map(e => e.id === id ? { ...e, unread: false } : e));
  const toggleLinkedInFlag = (id: string) => setLinkedInItems(p => p.map(m => m.id === id ? { ...m, flagged: !m.flagged } : m));

  const filteredEmails = emailItems.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'unread') return e.unread;
    if (filter === 'flagged') return e.flagged;
    return e.aiCategory === filter;
  });

  const unreadCount = emailItems.filter(e => e.unread).length;
  const linkedInUnread = linkedInItems.filter(m => m.unread).length;
  const categoryCounts = Object.keys(categoryConfig).reduce((acc, cat) => {
    acc[cat as EmailCategory] = emailItems.filter(e => e.aiCategory === cat).length;
    return acc;
  }, {} as Record<EmailCategory, number>);

  const selectedEmail = selectedId ? emailItems.find(e => e.id === selectedId) : null;

  const copyDraft = () => {
    if (selectedEmail?.draftReply) {
      navigator.clipboard.writeText(selectedEmail.draftReply).catch(() => {});
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* ── Left 2 columns: Email list ── */}
      <div className="xl:col-span-2 space-y-4">
        {/* AI Triage + Category Bar */}
        <div style={{ background: 'linear-gradient(135deg, rgba(18,18,28,0.98) 0%, rgba(32,28,48,0.98) 100%)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 12, padding: '14px 16px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={12} className="text-white" />
              </div>
              <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>AI Communication Triage</span>
            </div>
            <span style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '2px 8px', color: '#a78bfa', fontSize: '10px', fontWeight: 700 }}>✦ AI POWERED</span>
          </div>

          {/* Triage summary row */}
          <div className="flex flex-wrap gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
            {Object.entries(triageConfig).map(([key, cfg]) => {
              const count = emailItems.filter(e => e.aiTriage === key).length;
              if (count === 0) return null;
              return (
                <span key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: '3px 9px', color: cfg.color, fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {cfg.label} <span style={{ background: `${cfg.color}25`, borderRadius: 10, padding: '0 4px', fontSize: '9px' }}>{count}</span>
                </span>
              );
            })}
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(categoryConfig) as [EmailCategory, typeof categoryConfig[EmailCategory]][]).map(([key, cfg]) => {
              const count = categoryCounts[key];
              if (!count) return null;
              const CatIcon = cfg.icon;
              const active = filter === key;
              return (
                <button key={key} onClick={() => setFilter(active ? 'all' : key)} style={{ background: active ? cfg.bg : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '3px 10px', color: active ? cfg.color : '#666', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}>
                  <CatIcon size={9} />
                  {cfg.label} <span style={{ background: active ? `${cfg.color}25` : 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0 4px', fontSize: '9px', fontWeight: 700, color: active ? cfg.color : '#666' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email list */}
        <div className="card flex flex-col">
          <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="section-header mb-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,160,68,0.15)', border: '1px solid rgba(201,160,68,0.3)' }}>
                  <Mail size={13} style={{ color: '#c9a044' }} />
                </div>
                <span className="section-title">Inbox</span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <span className="badge-danger">{unreadCount} Unread</span>}
                <button style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '4px 8px', color: '#c9a044', fontSize: 11, cursor: 'pointer' }}>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all', 'unread', 'flagged'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'rgba(201,160,68,0.2)' : 'transparent', border: `1px solid ${filter === f ? 'rgba(201,160,68,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '3px 10px', color: filter === f ? '#c9a044' : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            {filteredEmails.map((email, idx) => {
              const catCfg = categoryConfig[email.aiCategory];
              const triageCfg = triageConfig[email.aiTriage];
              const CatIcon = catCfg.icon;
              const selected = selectedId === email.id;
              const sentiment = sentimentBar(email.sentimentScore);
              return (
                <div key={email.id} onClick={() => { setSelectedId(selected ? null : email.id); markRead(email.id); setCopiedDraft(false); }} style={{ borderBottom: idx < filteredEmails.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: selected ? 'rgba(201,160,68,0.07)' : email.unread ? 'rgba(201,160,68,0.03)' : 'transparent', borderLeft: selected ? '3px solid #c9a044' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-white/5">
                  <div className="px-4 py-3 flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1.5 pt-1 flex-shrink-0">
                      {email.unread ? <div className="unread-dot" /> : <div className="w-2 h-2" />}
                    </div>
                    <div className="avatar text-[#2a2a2a] flex-shrink-0" style={{ background: email.senderColor, fontSize: '11px' }}>{email.senderInitials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span style={{ color: email.unread ? '#fff' : '#d0d0d0', fontSize: '13px', fontWeight: email.unread ? 600 : 400 }} className="truncate">{email.sender}</span>
                        <span style={{ color: '#666', fontSize: '11px', flexShrink: 0 }}>{email.time}</span>
                      </div>
                      <p style={{ color: email.unread ? '#e0e0e0' : '#aaa', fontSize: '12px', fontWeight: email.unread ? 600 : 400 }} className="truncate mb-1">{email.subject}</p>
                      {/* AI Summary */}
                      <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 5, padding: '4px 8px', marginBottom: 5, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                        <Sparkles size={9} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ color: '#b0a0d8', fontSize: '11px', lineHeight: 1.4 }}>{email.aiSummary}</p>
                      </div>
                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span style={{ background: triageCfg.bg, border: `1px solid ${triageCfg.color}30`, borderRadius: 20, padding: '1px 7px', color: triageCfg.color, fontSize: '9px', fontWeight: 800 }}>{triageCfg.label}</span>
                        <span style={{ background: catCfg.bg, border: `1px solid ${catCfg.border}`, borderRadius: 20, padding: '1px 7px', color: catCfg.color, fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><CatIcon size={8} />{catCfg.label}</span>
                        {/* Sentiment */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                          <div style={{ width: 28, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                            <div style={{ width: `${sentiment.pct}%`, height: '100%', borderRadius: 2, background: sentiment.color }} />
                          </div>
                          <span style={{ color: sentiment.color, fontSize: '9px', fontWeight: 600 }}>{sentiment.label}</span>
                        </div>
                        {email.delegateTo && (
                          <span style={{ color: '#777', fontSize: '9px', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <UserMinus size={8} />→ {email.delegateTo}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleEmailFlag(email.id); }} className="flag-btn flex-shrink-0 mt-0.5">
                      <Flag size={12} fill={email.flagged ? '#c9a044' : 'none'} style={{ color: email.flagged ? '#c9a044' : '#555' }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="space-y-4">
        {/* Selected email detail */}
        {selectedEmail && (
          <div style={{ background: '#3a3a3a', border: '1px solid rgba(201,160,68,0.3)', borderRadius: 12, overflow: 'hidden' }} className="slide-in">
            {/* Email header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start gap-2.5">
                <div className="avatar text-[#2a2a2a]" style={{ background: selectedEmail.senderColor, fontSize: '11px' }}>{selectedEmail.senderInitials}</div>
                <div className="flex-1">
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{selectedEmail.sender}</p>
                  <p style={{ color: '#aaa', fontSize: '11px' }}>{selectedEmail.subject}</p>
                  <p style={{ color: '#666', fontSize: '10px' }}>{selectedEmail.time}</p>
                </div>
              </div>
            </div>

            {/* AI summary */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(139,92,246,0.12)', background: 'rgba(139,92,246,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={11} style={{ color: '#8b5cf6' }} />
                <span style={{ color: '#a78bfa', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>AI Analysis</span>
              </div>
              <p style={{ color: '#c8c0e8', fontSize: '12px', lineHeight: 1.5 }}>{selectedEmail.aiSummary}</p>
              {/* Triage recommendation */}
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: triageConfig[selectedEmail.aiTriage].bg, color: triageConfig[selectedEmail.aiTriage].color, fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: 20, border: `1px solid ${triageConfig[selectedEmail.aiTriage].color}30` }}>
                  AI says: {triageConfig[selectedEmail.aiTriage].label}
                </span>
              </div>
            </div>

            {/* Email preview */}
            <div style={{ padding: '10px 14px' }}>
              <p style={{ color: '#c0c0c0', fontSize: '12px', lineHeight: 1.6 }}>{selectedEmail.preview}</p>
            </div>

            {/* AI Draft Reply */}
            {selectedEmail.draftReply && (
              <div style={{ margin: '0 14px 12px', background: 'rgba(76,175,130,0.06)', border: '1px solid rgba(76,175,130,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={10} style={{ color: '#4caf82' }} />
                  <span style={{ color: '#4caf82', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>AI Draft Reply</span>
                </div>
                <p style={{ color: '#b0d8c0', fontSize: '12px', lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{selectedEmail.draftReply}&rdquo;</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={copyDraft} style={{ background: copiedDraft ? 'rgba(76,175,130,0.2)' : 'rgba(76,175,130,0.12)', border: `1px solid ${copiedDraft ? 'rgba(76,175,130,0.4)' : 'rgba(76,175,130,0.25)'}`, borderRadius: 6, padding: '4px 10px', color: '#4caf82', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {copiedDraft ? <><CheckCircle2 size={9} />Copied</> : <><Copy size={9} />Copy</>}
                  </button>
                  <button style={{ background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 6, padding: '4px 10px', color: '#c9a044', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <ArrowRight size={9} />Send Reply
                  </button>
                </div>
              </div>
            )}

            {/* Delegate suggestion */}
            {selectedEmail.delegateTo && (
              <div style={{ margin: '0 14px 12px', background: 'rgba(136,136,136,0.08)', border: '1px solid rgba(136,136,136,0.2)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserMinus size={12} style={{ color: '#888', flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#888', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Suggests: Delegate</p>
                  <p style={{ color: '#aaa', fontSize: '11px' }}>Forward to {selectedEmail.delegateTo}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LinkedIn panel */}
        <div className="card flex flex-col">
          <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
            <div className="flex items-center justify-between">
              <div className="section-header mb-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(10,102,194,0.2)', border: '1px solid rgba(10,102,194,0.4)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#0a66c2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </div>
                <span className="section-title">LinkedIn</span>
              </div>
              {linkedInUnread > 0 && <span className="badge-gold">{linkedInUnread} New</span>}
            </div>
          </div>
          <div>
            {linkedInItems.map((msg, idx) => (
              <div key={msg.id} style={{ borderBottom: idx < linkedInItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: msg.unread ? 'rgba(10,102,194,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }} className="px-4 py-3 hover:bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1.5">{msg.unread ? <div className="w-2 h-2 rounded-full bg-blue-500" /> : <div className="w-2 h-2" />}</div>
                  <div className="avatar text-[#2a2a2a] flex-shrink-0" style={{ background: msg.senderColor, fontSize: '11px' }}>{msg.senderInitials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span style={{ color: msg.unread ? '#fff' : '#d0d0d0', fontSize: '13px', fontWeight: msg.unread ? 600 : 400 }} className="truncate">{msg.sender}</span>
                        <span style={{ background: 'rgba(10,102,194,0.15)', color: '#4a9ed6', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(10,102,194,0.3)', flexShrink: 0 }}>{msg.connectionDegree}st</span>
                      </div>
                      <span style={{ color: '#666', fontSize: '10px', flexShrink: 0 }}>{msg.time}</span>
                    </div>
                    <p style={{ color: '#888', fontSize: '10px', marginTop: 1 }}>{msg.role} · {msg.company}</p>
                    <p style={{ color: msg.unread ? '#bbb' : '#777', fontSize: '11px', lineHeight: 1.4, marginTop: 3 }} className="line-clamp-2">{msg.preview}</p>
                  </div>
                  <button onClick={() => toggleLinkedInFlag(msg.id)} className="flag-btn flex-shrink-0">
                    <Flag size={11} fill={msg.flagged ? '#c9a044' : 'none'} style={{ color: msg.flagged ? '#c9a044' : '#555' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
