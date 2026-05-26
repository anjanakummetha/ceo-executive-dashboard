import Header from '@/components/dashboard/Header';
import TabNav, { type TabId, TAB_IDS } from '@/components/dashboard/TabNav';
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

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function Dashboard({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab: TabId = TAB_IDS.includes(tab as TabId) ? (tab as TabId) : 'today';

  const badges: Partial<Record<TabId, number>> = {
    inbox: unreadEmails,
    meetings: todayMeetings,
    tasks: overdueTasks,
    travel: travelAlerts,
    relationships: relationshipAlerts,
  };

  return (
    <div style={{ background: '#252525', minHeight: '100vh' }}>
      <Header />
      <TabNav activeTab={activeTab} badges={badges} />

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="slide-in">
          {activeTab === 'today'         && <TodayTab />}
          {activeTab === 'meetings'      && <MeetingsTab />}
          {activeTab === 'inbox'         && <InboxTab />}
          {activeTab === 'tasks'         && <TasksTab />}
          {activeTab === 'relationships' && <RelationshipsTab />}
          {activeTab === 'travel'        && <TravelTab />}
          {activeTab === 'health'        && <HealthPanel />}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid rgba(201,160,68,0.1)', padding: '14px 24px', textAlign: 'center', marginTop: 24 }}>
        <span style={{ color: '#3a3a3a', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
          Iconic Founders Group · CEO Executive Dashboard
        </span>
      </footer>
    </div>
  );
}
