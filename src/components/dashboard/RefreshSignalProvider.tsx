'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * A monotonic "refresh nonce" the global refresh button bumps. Tabs that fetch
 * their own AI (Today briefing/priorities, Inbox triage) watch it and force a
 * regenerate on the next data update, instead of serving the once-per-day cache.
 */
type RefreshSignalValue = {
  nonce: number;
  bumpNonce: () => void;
};

const RefreshSignalContext = createContext<RefreshSignalValue>({
  nonce: 0,
  bumpNonce: () => {},
});

export function RefreshSignalProvider({ children }: { children: ReactNode }) {
  const [nonce, setNonce] = useState(0);
  const bumpNonce = useCallback(() => setNonce((n) => n + 1), []);
  const value = useMemo(() => ({ nonce, bumpNonce }), [nonce, bumpNonce]);
  return (
    <RefreshSignalContext.Provider value={value}>{children}</RefreshSignalContext.Provider>
  );
}

export function useRefreshSignal(): RefreshSignalValue {
  return useContext(RefreshSignalContext);
}
