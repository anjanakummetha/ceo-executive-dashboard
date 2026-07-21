/**
 * One-off read-only probe: verify Composio → LinkedIn (profile info only).
 * Run: node scripts/probe-linkedin.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const COMPOSIO_BASE = 'https://backend.composio.dev';
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (!process.env[trimmed.slice(0, eq)]) process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
} catch {
  /* .env.local optional */
}

const apiKey = process.env.COMPOSIO_API_KEY;
const userId = process.env.COMPOSIO_USER_ID;
const account = process.env.COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID;

if (!account) {
  console.log('LinkedIn: not connected (COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID unset). Panel will degrade quietly.');
  process.exit(0);
}
if (!apiKey || !userId) {
  console.error('Missing COMPOSIO_API_KEY or COMPOSIO_USER_ID');
  process.exit(1);
}

const res = await fetch(`${COMPOSIO_BASE}/api/v3.1/tools/execute/LINKEDIN_GET_MY_INFO`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  body: JSON.stringify({ connected_account_id: account, entity_id: userId, arguments: {}, dangerously_skip_version_check: true }),
});
const json = await res.json();
if (!res.ok || json.successful === false) {
  console.error('LinkedIn probe FAILED:', json.error || res.status);
  process.exit(1);
}
console.log('LinkedIn probe OK — profile info reachable (read-only).');
