'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TabNav, { TAB_IDS, type TabId } from '@/components/dashboard/TabNav';
import { SyncProvider, useSync } from '@/components/dashboard/SyncProvider';
import { AttendeeIntelProvider, useAttendeeIntel } from '@/components/dashboard/AttendeeIntelProvider';
import { RefreshSignalProvider, useRefreshSignal } from '@/components/dashboard/RefreshSignalProvider';
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

  const { refresh } = useSync();
  const { refreshIntel } = useAttendeeIntel();
  const { bumpNonce } = useRefreshSignal();

  const loadBadges = useCallback(async (force = false) => {
    try {
      const res = await fetch(force ? '/api/badges?refresh=1' : '/api/badges');
      if (res.ok) setBadges(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount badge poll; setState runs after await (no cascading render)
    loadBadges();
    const id = setInterval(loadBadges, 120_000);
    return () => clearInterval(id);
  }, [loadBadges]);

  /** One button, whole dashboard: force live data + regenerate every AI surface. */
  const refreshAll = useCallback(async () => {
    // Live data first so the AI regenerates off the fresh snapshot, then bump the
    // nonce so Today/Inbox force their AI, and refresh attendee intel + badges.
    await refresh(true);
    bumpNonce();
    await Promise.all([refreshIntel(), loadBadges(true)]);
  }, [bumpNonce, refresh, refreshIntel, loadBadges]);

  useEffect(() => {
    const handler = () => {
      void refreshAll().finally(() =>
        window.dispatchEvent(new Event('dashboard:refresh-done')),
      );
    };
    window.addEventListener('dashboard:refresh-request', handler);
    return () => window.removeEventListener('dashboard:refresh-request', handler);
  }, [refreshAll]);

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
            <TodayTab onNavigate={setTab} />
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
        <RefreshSignalProvider>
          <DashboardBody />
        </RefreshSignalProvider>
      </AttendeeIntelProvider>
    </SyncProvider>
  );
}
