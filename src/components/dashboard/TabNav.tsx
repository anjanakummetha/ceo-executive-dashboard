'use client';

import type { ElementType } from 'react';
import { LayoutDashboard, Calendar, Mail, CheckSquare, Plane, Heart, Users } from 'lucide-react';

export type TabId = 'today' | 'meetings' | 'inbox' | 'tasks' | 'relationships' | 'travel' | 'health';

export const TAB_IDS: TabId[] = ['today', 'meetings', 'inbox', 'tasks', 'relationships', 'travel', 'health'];

interface TabNavProps {
  activeTab: TabId;
  badges?: Partial<Record<TabId, number>>;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: ElementType }[] = [
  { id: 'today', label: 'Today', icon: LayoutDashboard },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'inbox', label: 'Inbox', icon: Mail },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'relationships', label: 'Meeting People', icon: Users },
  { id: 'travel', label: 'Travel & Family', icon: Plane },
  { id: 'health', label: 'Health', icon: Heart },
];

export default function TabNav({ activeTab, badges = {}, onTabChange }: TabNavProps) {
  return (
    <nav
      style={{
        background: 'var(--bg-nav)',
        borderBottom: '1px solid var(--gold-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
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
                  color: active ? 'var(--gold-primary)' : 'var(--text-muted)',
                  background: active ? 'var(--gold-muted)' : 'transparent',
                  borderBottom: active ? '2px solid var(--gold-primary)' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  letterSpacing: '0.2px',
                  cursor: 'pointer',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                <Icon size={14} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span
                    style={{
                      background: active ? 'var(--gold-primary)' : 'var(--danger)',
                      color: '#ffffff',
                      borderRadius: 10,
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      lineHeight: '14px',
                    }}
                  >
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
