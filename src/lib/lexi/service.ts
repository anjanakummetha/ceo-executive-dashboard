/**
 * Client for the Lexi agent's read-only /api/v1 (localhost, bearer token).
 * Powers the "Lexi Assistant" panel. Never throws to the caller — any failure
 * yields { available: false } so the dashboard page never breaks when the agent
 * is offline.
 */

const BASE = process.env.LEXI_API_URL || 'http://127.0.0.1:8081';
const TOKEN = process.env.LEXI_API_TOKEN || '';

export interface LexiSummary {
  available: boolean;
  health?: { status: string; db_ok: boolean; worker_heartbeat_stale?: boolean };
  pendingApprovals?: { count: number; items: LexiPendingItem[] };
  holds?: { count: number; active: LexiHold[] };
  costs?: {
    llm?: { today_usd?: number; month_usd?: number; cache_hit_ratio?: number };
    composio?: { today_calls?: number; month_calls?: number; fraction_used?: number };
  };
  activity?: LexiActivity[];
  error?: string;
}

export interface LexiPendingItem {
  id: number;
  subject: string;
  requester: string;
  status: string;
  proposed_slots: Array<{ start?: string; end?: string }>;
  created_at: string;
}
export interface LexiHold {
  proposal_id: number;
  title: string;
  slot_start: string;
  slot_end: string;
  expires_at: string;
}
export interface LexiActivity {
  timestamp: string;
  step: string;
  level: string;
  message: string;
}

async function get<T>(path: string, timeoutMs = 3000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLexiSummary(): Promise<LexiSummary> {
  // Health first: if the agent isn't reachable, don't fan out.
  const health = await get<LexiSummary['health']>('/api/v1/health');
  if (!health) return { available: false, error: 'Lexi agent not reachable' };

  const [pending, holds, costs, audit] = await Promise.all([
    get<LexiSummary['pendingApprovals']>('/api/v1/pending-approvals'),
    get<LexiSummary['holds']>('/api/v1/holds'),
    get<LexiSummary['costs']>('/api/v1/costs'),
    get<{ items: LexiActivity[] }>('/api/v1/audit?limit=12'),
  ]);

  return {
    available: true,
    health,
    pendingApprovals: pending ?? { count: 0, items: [] },
    holds: holds ?? { count: 0, active: [] },
    costs: costs ?? {},
    activity: audit?.items ?? [],
  };
}
