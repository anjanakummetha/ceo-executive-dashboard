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
import type { AttendeeIntel, AttendeeIntelBundle } from '@/lib/ai/types';
import { buildTodayPeopleFromMeetings, type TodayPerson } from '@/lib/outlook/meeting-people';
import { useSync } from '@/components/dashboard/SyncProvider';

type AttendeeIntelContextValue = {
  bundle: AttendeeIntelBundle | null;
  loading: boolean;
  error: string | null;
  refreshIntel: () => Promise<void>;
  people: TodayPerson[];
  intelByKey: Map<string, AttendeeIntel>;
};

const AttendeeIntelContext = createContext<AttendeeIntelContextValue | null>(null);

function intelKey(name: string, email?: string): string {
  return email?.trim().toLowerCase() || name.trim().toLowerCase();
}

export function AttendeeIntelProvider({ children }: { children: ReactNode }) {
  const { meetings, loading: syncLoading } = useSync();
  const [bundle, setBundle] = useState<AttendeeIntelBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const refreshIntel = useCallback(async (force = false) => {
    if (syncLoading) return;
    setLoading(true);
    setError(null);
    try {
      const url = force ? '/api/hermes/attendee-bios?refresh=1' : '/api/hermes/attendee-bios';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load attendee intel');
      setBundle(json as AttendeeIntelBundle);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendee intel');
    } finally {
      setLoading(false);
    }
  }, [syncLoading]);

  useEffect(() => {
    if (syncLoading || fetched) return;
    if (meetings.filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting').length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- run-once latch marking the empty-meetings case fetched; no external data to load
      setFetched(true);
      return;
    }
    refreshIntel(false);
  }, [syncLoading, meetings, fetched, refreshIntel]);

  const intelByKey = useMemo(() => {
    const map = new Map<string, AttendeeIntel>();
    for (const p of bundle?.people ?? []) {
      map.set(intelKey(p.name, p.email), p);
    }
    return map;
  }, [bundle]);

  const people = useMemo(() => {
    const base = buildTodayPeopleFromMeetings(meetings);
    return base.map((p) => {
      const intel = intelByKey.get(intelKey(p.name, p.email));
      return intel
        ? {
            ...p,
            bio: intel.bio,
            introducedBy: intel.introducedBy,
            relationshipContext: intel.relationshipContext,
            angle: intel.angle,
            conversationTip: intel.conversationTip,
            company: p.company || intel.emailContext?.companyGuess || p.company,
            recurring: intel.recurring ?? p.recurring,
            actionNeeded: intel.actionNeeded,
            actionNote: intel.actionNote,
          }
        : p;
    });
  }, [meetings, intelByKey]);

  const value = useMemo(
    () => ({
      bundle,
      loading,
      error,
      refreshIntel: () => refreshIntel(true),
      people,
      intelByKey,
    }),
    [bundle, loading, error, refreshIntel, people, intelByKey],
  );

  return (
    <AttendeeIntelContext.Provider value={value}>{children}</AttendeeIntelContext.Provider>
  );
}

export function useAttendeeIntel(): AttendeeIntelContextValue {
  const ctx = useContext(AttendeeIntelContext);
  if (!ctx) throw new Error('useAttendeeIntel must be used within AttendeeIntelProvider');
  return ctx;
}
