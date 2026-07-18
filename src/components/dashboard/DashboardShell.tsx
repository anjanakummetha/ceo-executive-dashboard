'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TabNav, { TAB_IDS, type TabId } from '@/components/dashboard/TabNav';
import { SyncProvider } from '@/components/dashboard/SyncProvider';
import { AttendeeIntelProvider } from '@/components/dashboard/AttendeeIntelProvider';
import TodayTab from '@/components/dashboard/TodayTab';
import MeetingsTab from '@/components/dashboard/MeetingsTab';
import InboxTab from '@/components/dashboard/InboxTab';
import TasksTab from '@/components/dashboard/TasksTab';
import RelationshipsTab from '@/components/dashboard/RelationshipsTab';
import TravelTab from '@/components/dashboard/TravelTab';
import HealthPanel from '@/components/dashboard/HealthPanel';

function tabFromSearch(tab: string | null): TabId {
  return TAB_IDS.includes(tab as TabId) ? (tab as TabId) : 'today';
}

function DashboardBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = tabFromSearch(searchParams.get('tab'));

  const [badges, setBadges] = useState<Partial<Record<TabId, number>>>({});

  const loadBadges = useCallback(async () => {
    try {
      const res = await fetch('/api/badges');
      if (res.ok) setBadges(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadBadges();
    const id = setInterval(loadBadges, 120_000);
    return () => clearInterval(id);
  }, [loadBadges]);

  const setTab = (id: TabId) => {
    const href = id === 'today' ? '/' : `/?tab=${id}`;
    router.replace(href, { scroll: false });
  };

  return (
    <>
      <TabNav activeTab={activeTab} badges={badges} onTabChange={setTab} />
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="slide-in">
          <div style={{ display: activeTab === 'today' ? 'block' : 'none' }}>
            <TodayTab />
          </div>
          <div style={{ display: activeTab === 'meetings' ? 'block' : 'none' }}>
            <MeetingsTab />
          </div>
          <div style={{ display: activeTab === 'inbox' ? 'block' : 'none' }}>
            <InboxTab />
          </div>
          <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
            <TasksTab />
          </div>
          <div style={{ display: activeTab === 'relationships' ? 'block' : 'none' }}>
            <RelationshipsTab />
          </div>
          <div style={{ display: activeTab === 'travel' ? 'block' : 'none' }}>
            <TravelTab />
          </div>
          <div style={{ display: activeTab === 'health' ? 'block' : 'none' }}>
            <HealthPanel />
          </div>
        </div>
      </main>
    </>
  );
}

export default function DashboardShell() {
  return (
    <SyncProvider>
      <AttendeeIntelProvider>
        <DashboardBody />
      </AttendeeIntelProvider>
    </SyncProvider>
  );
}
