'use client';

import { useState } from 'react';
import Header from '@/components/dashboard/Header';
import TabNav, { type TabId } from '@/components/dashboard/TabNav';
import TodayTab from '@/components/dashboard/TodayTab';
import MeetingsTab from '@/components/dashboard/MeetingsTab';
import InboxTab from '@/components/dashboard/InboxTab';
import TasksTab from '@/components/dashboard/TasksTab';
import RelationshipsTab from '@/components/dashboard/RelationshipsTab';
import TravelTab from '@/components/dashboard/TravelTab';
import HealthPanel from '@/components/dashboard/HealthPanel';
import { emails, meetings, asanaTasks, travelSegments, relationshipContacts } from '@/lib/data';

const unreadEmails = emails.filter(e => e.unread).length;
const todayMeetings = meetings.length;
const overdueTasks = asanaTasks.filter(t => t.status === 'overdue').length;
const travelAlerts = travelSegments.filter(s => s.flagged).length;
const relationshipAlerts = relationshipContacts.filter(c => c.health === 'cold' || c.health === 'cooling').length;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  const badges: Partial<Record<TabId, number>> = {
    inbox: unreadEmails,
    meetings: todayMeetings,
    tasks: overdueTasks,
    travel: travelAlerts,
    relationships: relationshipAlerts,
  };

  return (
    <div style={{ background: '#2a2a2a', minHeight: '100vh' }}>
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} badges={badges} />

      <main className="max-w-[1600px] mx-auto px-4 py-5">
        {activeTab === 'today'         && <div className="slide-in"><TodayTab /></div>}
        {activeTab === 'meetings'      && <div className="slide-in"><MeetingsTab /></div>}
        {activeTab === 'inbox'         && <div className="slide-in"><InboxTab /></div>}
        {activeTab === 'tasks'         && <div className="slide-in"><TasksTab /></div>}
        {activeTab === 'relationships' && <div className="slide-in"><RelationshipsTab /></div>}
        {activeTab === 'travel'        && <div className="slide-in"><TravelTab /></div>}
        {activeTab === 'health'        && <div className="slide-in max-w-2xl mx-auto"><HealthPanel /></div>}
      </main>

      <footer style={{ borderTop: '1px solid rgba(201,160,68,0.12)', padding: '12px 24px', textAlign: 'center', marginTop: 24 }}>
        <span style={{ color: '#444', fontSize: '11px', letterSpacing: '0.5px' }}>
          Iconic Founders Group · CEO Executive Dashboard
        </span>
      </footer>
    </div>
  );
}
