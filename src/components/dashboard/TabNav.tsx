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
        background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(246,243,236,0.42))',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        borderBottom: '1px solid rgba(255,255,255,0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 4px 18px rgba(44,40,36,0.06)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center gap-1 py-2" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const badge = badges[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className="press sheen"
                style={{
                  padding: '9px 15px',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--gold-primary)' : 'var(--text-muted)',
                  background: active
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(201,160,68,0.14))'
                    : 'transparent',
                  border: active ? '1px solid rgba(201,160,68,0.4)' : '1px solid transparent',
                  borderRadius: 11,
                  boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.8), 0 3px 10px rgba(138,109,38,0.12)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  letterSpacing: '0.2px',
                  cursor: 'pointer',
                  transition: 'color 0.18s, background 0.18s, border-color 0.18s, box-shadow 0.18s',
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
