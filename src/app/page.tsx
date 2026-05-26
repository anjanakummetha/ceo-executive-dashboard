'use client';

import { useState } from 'react';
import Header from '@/components/dashboard/Header';
import TabNav, { type TabId } from '@/components/dashboard/TabNav';
import DailyBriefing from '@/components/dashboard/DailyBriefing';
import TopPriorities from '@/components/dashboard/TopPriorities';
import MeetingsTab from '@/components/dashboard/MeetingsTab';
import InboxTab from '@/components/dashboard/InboxTab';
import TasksTab from '@/components/dashboard/TasksTab';
import TravelTab from '@/components/dashboard/TravelTab';
import HealthPanel from '@/components/dashboard/HealthPanel';
import { emails, meetings, asanaTasks, travelSegments } from '@/lib/data';

// Pre-compute badge counts
const unreadEmails = emails.filter(e => e.unread).length;
const todayMeetings = meetings.length;
const overdueTasks = asanaTasks.filter(t => t.status === 'overdue').length;
const travelAlerts = travelSegments.filter(s => s.flagged).length;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  const badges: Partial<Record<TabId, number>> = {
    inbox: unreadEmails,
    meetings: todayMeetings,
    tasks: overdueTasks,
    travel: travelAlerts,
  };

  return (
    <div style={{ background: '#2e2e2e', minHeight: '100vh' }}>
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} badges={badges} />

      <main className="max-w-[1600px] mx-auto px-4 py-5">
        {/* ── Today ── */}
        {activeTab === 'today' && (
          <div className="space-y-5 slide-in">
            <DailyBriefing />
            <TopPriorities />
          </div>
        )}

        {/* ── Meetings ── */}
        {activeTab === 'meetings' && (
          <div className="slide-in">
            <MeetingsTab />
          </div>
        )}

        {/* ── Inbox ── */}
        {activeTab === 'inbox' && (
          <div className="slide-in">
            <InboxTab />
          </div>
        )}

        {/* ── Tasks ── */}
        {activeTab === 'tasks' && (
          <div className="slide-in">
            <TasksTab />
          </div>
        )}

        {/* ── Travel ── */}
        {activeTab === 'travel' && (
          <div className="slide-in">
            <TravelTab />
          </div>
        )}

        {/* ── Health ── */}
        {activeTab === 'health' && (
          <div className="slide-in max-w-2xl">
            <HealthPanel />
          </div>
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid rgba(201,160,68,0.15)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
        className="mt-6"
      >
        <div
          style={{ background: 'linear-gradient(135deg, #c9a044, #d4af60)' }}
          className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black text-[#2a2a2a]"
        >
          IF
        </div>
        <span style={{ color: '#555', fontSize: '11px', letterSpacing: '0.5px' }}>
          ICONIC FOUNDERS GROUP · CEO Executive Dashboard · Preserving Legacy
        </span>
      </footer>
    </div>
  );
}
