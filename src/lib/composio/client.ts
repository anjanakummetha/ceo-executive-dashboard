/**
 * Thin Composio REST client for server-side tool execution.
 */

const COMPOSIO_BASE = 'https://backend.composio.dev';

export type ComposioToolkit = 'asana' | 'outlook' | 'linkedin';

/**
 * READ-ONLY GUARANTEE (structural, not policy).
 *
 * This dashboard must never mutate Outlook / Asana / LinkedIn. Every Composio
 * call funnels through executeComposioTool, so we enforce read-only here at the
 * single choke point — the same pattern as the Lexi agent's guard: an exact
 * allowlist of the read slugs in use, plus a verb check as belt-and-suspenders.
 * Anything else throws BEFORE any network request is made.
 */
export const READ_ONLY_TOOL_ALLOWLIST: ReadonlySet<string> = new Set([
  'OUTLOOK_GET_CALENDAR_VIEW',
  'OUTLOOK_LIST_CALENDARS',
  'OUTLOOK_LIST_MESSAGES',
  'OUTLOOK_SEARCH_MESSAGES',
  'ASANA_GET_TASKS_FROM_A_PROJECT',
  'ASANA_GET_A_PROJECT',
  'ASANA_GET_WORKSPACE_PROJECTS',
  'ASANA_GET_MULTIPLE_WORKSPACES',
  'LINKEDIN_GET_MY_INFO',
]);

const READ_VERB_RE = /^(OUTLOOK|ASANA|LINKEDIN)_(GET|LIST|SEARCH|FIND|RETRIEVE)/;

export class ReadOnlyViolationError extends Error {
  constructor(toolSlug: string) {
    super(
      `Read-only violation: tool "${toolSlug}" is not on the dashboard's read allowlist. ` +
        'This dashboard never writes to Outlook/Asana/LinkedIn.',
    );
    this.name = 'ReadOnlyViolationError';
  }
}

export function assertReadOnlyTool(toolSlug: string): void {
  const slug = toolSlug.trim().toUpperCase();
  if (!READ_ONLY_TOOL_ALLOWLIST.has(slug) || !READ_VERB_RE.test(slug)) {
    throw new ReadOnlyViolationError(toolSlug);
  }
}

export function getComposioConfig(toolkit: ComposioToolkit = 'asana') {
  const apiKey = process.env.COMPOSIO_API_KEY;
  const userId = process.env.COMPOSIO_USER_ID;

  const connectedAccountId =
    toolkit === 'outlook'
      ? process.env.COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID
      : toolkit === 'linkedin'
        ? process.env.COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID
        : process.env.COMPOSIO_ASANA_CONNECTED_ACCOUNT_ID ??
          process.env.COMPOSIO_CONNECTED_ACCOUNT_ID;

  if (!apiKey) throw new Error('COMPOSIO_API_KEY is not set');
  if (!userId) throw new Error('COMPOSIO_USER_ID is not set');
  if (!connectedAccountId) {
    const msg: Record<ComposioToolkit, string> = {
      asana: 'COMPOSIO_ASANA_CONNECTED_ACCOUNT_ID (or COMPOSIO_CONNECTED_ACCOUNT_ID) is not set',
      outlook: 'COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID is not set',
      linkedin: 'COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID is not set',
    };
    throw new Error(msg[toolkit]);
  }

  return { apiKey, connectedAccountId, userId, toolkit };
}

export async function executeComposioTool<T = unknown>(
  toolSlug: string,
  args: Record<string, unknown>,
  toolkit: ComposioToolkit = 'asana',
): Promise<T> {
  assertReadOnlyTool(toolSlug);
  const { apiKey, connectedAccountId, userId } = getComposioConfig(toolkit);

  const res = await fetch(
    `${COMPOSIO_BASE}/api/v3.1/tools/execute/${toolSlug}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        connected_account_id: connectedAccountId,
        entity_id: userId,
        arguments: args,
        dangerously_skip_version_check: true,
      }),
      cache: 'no-store',
    },
  );

  const json = (await res.json()) as {
    successful?: boolean;
    data?: T | string;
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message || json.error || `Composio HTTP ${res.status}`);
  }

  if (json.successful === false) {
    throw new Error(json.error || `Composio tool failed: ${toolSlug}`);
  }

  let data = json.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as T;
    } catch {
      /* keep string */
    }
  }

  return data as T;
}
