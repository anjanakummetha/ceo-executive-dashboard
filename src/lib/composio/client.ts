/**
 * Thin Composio REST client for server-side tool execution.
 */

const COMPOSIO_BASE = 'https://backend.composio.dev';

export type ComposioToolkit = 'asana' | 'outlook' | 'linkedin';

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
