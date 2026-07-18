/**
 * One-off probe: verify Composio → Asana and find "Kory NON-IFG" project GID.
 * Run: node scripts/probe-asana.mjs
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
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* .env.local optional if vars already set */
}

const apiKey = process.env.COMPOSIO_API_KEY;
const connectedAccountId = process.env.COMPOSIO_CONNECTED_ACCOUNT_ID;
const userId = process.env.COMPOSIO_USER_ID;
const projectName = process.env.ASANA_PROJECT_NAME || 'Kory NON-IFG';

if (!apiKey || !connectedAccountId || !userId) {
  console.error('Missing COMPOSIO_API_KEY, COMPOSIO_CONNECTED_ACCOUNT_ID, or COMPOSIO_USER_ID');
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
    console.error('Composio response:', JSON.stringify(json, null, 2));
    const err =
      typeof json.error === 'string'
        ? json.error
        : json.message || JSON.stringify(json.error) || `Failed: ${slug} (${res.status})`;
    throw new Error(err);
  }
  const raw = json.data;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function main() {
  console.log('Connected account:', connectedAccountId);
  console.log('Looking for project:', projectName);

  const workspaces = await exec('ASANA_GET_MULTIPLE_WORKSPACES', { limit: 50 });
  const wsList = workspaces?.data ?? workspaces ?? [];
  console.log('Workspaces:', wsList.length);

  let found = null;
  for (const ws of wsList) {
    const gid = ws.gid;
    const projects = await exec('ASANA_GET_WORKSPACE_PROJECTS', {
      workspace_gid: gid,
      limit: 100,
      opt_fields: ['name', 'gid', 'permalink_url'],
    });
    const list = projects?.data ?? projects ?? [];
    for (const p of list) {
      if (p.name === projectName) {
        found = { ...p, workspace_gid: gid, workspace_name: ws.name };
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    console.error('Project not found. Check ASANA_PROJECT_NAME and Asana connection in Composio.');
    process.exit(1);
  }

  console.log('\n✓ Found project');
  console.log('  name:', found.name);
  console.log('  gid:', found.gid);
  console.log('  workspace:', found.workspace_name);

  const tasks = await exec('ASANA_GET_TASKS_FROM_A_PROJECT', {
    project_gid: found.gid,
    limit: 20,
    opt_fields: ['name', 'due_on', 'completed', 'memberships.section.name'],
  });
  const taskList = tasks?.data ?? tasks ?? [];
  console.log('\nSample tasks:', taskList.length);
  for (const t of taskList.slice(0, 5)) {
    const section =
      t.memberships?.find((m) => m.section?.name)?.section?.name ?? '—';
    console.log(`  - [${section}] ${t.name} (due: ${t.due_on ?? 'none'})`);
  }

  console.log('\nAdd to .env.local:');
  console.log(`ASANA_PROJECT_GID=${found.gid}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
