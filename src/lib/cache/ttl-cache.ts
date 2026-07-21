type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function cacheThrough<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fn();
  cacheSet(key, value, ttlMs);
  return value;
}

export function cacheInvalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Default TTLs (ms). Raised to keep the shared Composio call budget (200k/mo,
 * also used by the Lexi agent) comfortable — cost scales with cache windows
 * during active use, not with page loads. */
export const CACHE_TTL = {
  meetings: 5 * 60_000,
  tasks: 10 * 60_000,
  inbox: 5 * 60_000,
  linkedin: 6 * 60 * 60_000, // static profile info — cache long
  travel: 15 * 60_000,
  badges: 5 * 60_000,
  calendars: 24 * 60 * 60_000, // calendar list rarely changes
  weekAhead: 30 * 60_000, // shared fetch for week-ahead / family / reservations
  lexi: 60_000, // Lexi assistant panel (localhost + SQLite, cheap)
  aiDay: 12 * 60 * 60_000,
} as const;
