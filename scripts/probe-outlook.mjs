/**
 * Probe Composio → Outlook calendars + today's events (all calendars).
 * Run: node scripts/probe-outlook.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq);
  const val = trimmed.slice(eq + 1);
  if (!process.env[key]) process.env[key] = val;
}

const COMPOSIO_BASE = 'https://backend.composio.dev';
const apiKey = process.env.COMPOSIO_API_KEY;
const userId = process.env.COMPOSIO_USER_ID;
const connectedAccountId =
  process.env.COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID ||
  process.env.COMPOSIO_CONNECTED_ACCOUNT_ID;

if (!apiKey || !userId || !connectedAccountId) {
  console.error('Need COMPOSIO_API_KEY, COMPOSIO_USER_ID, and Outlook connected account id');
  process.exit(1);
}

async function exec(slug, arguments_) {
  const res = await fetch(`${COMPOSIO_BASE}/api/v3.1/tools/execute/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      connected_account_id: connectedAccountId,
      entity_id: userId,
      arguments: arguments_,
      dangerously_skip_version_check: true,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.successful === false) {
    console.error(JSON.stringify(json, null, 2));
    throw new Error(json.error?.message || json.error || slug);
  }
  const raw = json.data;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function mtDayBounds() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  const start = `${y}-${m}-${d}T00:00:00`;
  const end = `${y}-${m}-${d}T23:59:59`;
  return { start, end, label: `${y}-${m}-${d}` };
}

async function main() {
  console.log('Outlook connected account:', connectedAccountId);

  const calendarsResp = await exec('OUTLOOK_LIST_CALENDARS', {});
  const calendars = calendarsResp?.value ?? calendarsResp?.data?.value ?? calendarsResp?.data ?? [];
  console.log(`\nCalendars found: ${calendars.length}`);
  for (const cal of calendars.slice(0, 15)) {
    console.log(`  - ${cal.name} (${cal.id})`);
  }

  const { start, end, label } = mtDayBounds();
  console.log(`\nEvents on ${label} (MT), all calendars:`);

  let total = 0;
  for (const cal of calendars) {
    try {
      const view = await exec('OUTLOOK_GET_CALENDAR_VIEW', {
        calendar_id: cal.id,
        start_datetime: start,
        end_datetime: end,
        timezone: 'America/Denver',
      });
      const events = view?.value ?? view?.data?.value ?? [];
      if (events.length) {
        console.log(`\n  [${cal.name}]`);
        for (const ev of events) {
          total++;
          const t = ev.start?.dateTime ?? ev.start?.date ?? '?';
          console.log(`    · ${ev.subject ?? '(no subject)'} @ ${t}`);
        }
      }
    } catch (e) {
      console.log(`  [${cal.name}] skip: ${e.message}`);
    }
  }
  console.log(`\nTotal events today: ${total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
