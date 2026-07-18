'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AsanaTask, Email, Meeting } from '@/lib/data';
import type { TodaySnapshot } from '@/lib/sync/today-snapshot';

type SyncContextValue = {
  snapshot: TodaySnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
  meetings: Meeting[];
  tasks: AsanaTask[];
  emails: Email[];
  syncedAt: string | null;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? '/api/sync/today?refresh=1' : '/api/sync/today';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      setSnapshot(json as TodaySnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  const value = useMemo<SyncContextValue>(
    () => ({
      snapshot,
      loading,
      error,
      refresh,
      meetings: snapshot?.meetings ?? [],
      tasks: snapshot?.tasks ?? [],
      emails: snapshot?.emails ?? [],
      syncedAt: snapshot?.syncedAt ?? null,
    }),
    [snapshot, loading, error, refresh],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
