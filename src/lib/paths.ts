import { join, isAbsolute } from 'path';

/**
 * Persistent data directory for the dashboard's local JSON (health logs, daily
 * briefing, AI cache). Under a Next standalone build the cwd is the bundle dir
 * and redeploys wipe it — so in production point DASHBOARD_DATA_DIR at a stable
 * path like /var/lib/ceo-dashboard. Defaults to ./data for local dev.
 */
export function dataDir(): string {
  const raw = process.env.DASHBOARD_DATA_DIR?.trim();
  if (raw) return isAbsolute(raw) ? raw : join(process.cwd(), raw);
  return join(process.cwd(), 'data');
}

export function dataPath(...segments: string[]): string {
  return join(dataDir(), ...segments);
}
