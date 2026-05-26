'use client';

import type { ElementType } from 'react';
import { LayoutDashboard, Calendar, Mail, CheckSquare, Plane, Heart, Users } from 'lucide-react';

export type TabId = 'today' | 'meetings' | 'inbox' | 'tasks' | 'relationships' | 'travel' | 'health';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  badges?: Partial<Record<TabId, number>>;
}

const tabs: { id: TabId; label: string; icon: ElementType }[] = [
  { id: 'today',         label: 'Today',         icon: LayoutDashboard },
  { id: 'meetings',      label: 'Meetings',       icon: Calendar },
  { id: 'inbox',         label: 'Inbox',          icon: Mail },
  { id: 'tasks',         label: 'Tasks',          icon: CheckSquare },
  { id: 'relationships', label: 'Relationships',  icon: Users },
  { id: 'travel',        label: 'Travel',         icon: Plane },
  { id: 'health',        label: 'Health',         icon: Heart },
];

export default function TabNav({ activeTab, onTabChange, badges = {} }: TabNavProps) {
  return (
    <nav style={{ background: '#2a2a2a', borderBottom: '1px solid rgba(201,160,68,0.15)', position: 'relative', zIndex: 40 }}>
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const badge = badges[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                style={{
                  padding: '13px 18px',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#c9a044' : '#666',
                  background: active ? 'rgba(201,160,68,0.05)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #c9a044' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  transition: 'color 0.2s, border-color 0.2s, background 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  letterSpacing: '0.2px',
                  outline: 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <Icon size={14} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span style={{ background: active ? '#c9a044' : '#e05252', color: active ? '#1a1a1a' : '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '10px', fontWeight: 700, lineHeight: '14px' }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
