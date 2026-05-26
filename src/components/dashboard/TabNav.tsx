'use client';

import { LayoutDashboard, Calendar, Mail, CheckSquare, Plane, Heart, Users } from 'lucide-react';

export type TabId = 'today' | 'meetings' | 'inbox' | 'tasks' | 'relationships' | 'travel' | 'health';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  badges?: Partial<Record<TabId, number>>;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
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
    <nav style={{ background: '#323232', borderBottom: '1px solid rgba(201,160,68,0.2)' }}>
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const badge = badges[id];
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#c9a044' : '#777',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid #c9a044' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Icon size={14} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span style={{ background: active ? '#c9a044' : '#e05252', color: active ? '#2a2a2a' : '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
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
