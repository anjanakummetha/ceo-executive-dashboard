import type { Email } from '@/lib/data';
import { executeComposioTool } from '@/lib/composio/client';
import { mapOutlookMessageToEmail } from './map-message';
import type { OutlookMessageRaw } from './types';

const MESSAGE_SELECT = [
  'id',
  'subject',
  'from',
  'toRecipients',
  'receivedDateTime',
  'isRead',
  'flag',
  'bodyPreview',
  'webLink',
];

function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

function parseList<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.value)) return p.value as T[];
  if (p.data && typeof p.data === 'object') {
    const d = p.data as Record<string, unknown>;
    if (Array.isArray(d.value)) return d.value as T[];
  }
  return [];
}

function inboxDays(): number {
  const n = Number(process.env.OUTLOOK_INBOX_DAYS ?? 14);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 14;
}

function inboxTop(): number {
  const n = Number(process.env.OUTLOOK_INBOX_TOP ?? 75);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 75;
}

export async function fetchInboxMessages(): Promise<{
  emails: Email[];
  syncedAt: string;
}> {
  if (shouldUseMockData()) {
    const { emails } = await import('@/lib/data');
    return { emails, syncedAt: new Date().toISOString() };
  }

  const days = inboxDays();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const result = await executeComposioTool<unknown>(
    'OUTLOOK_LIST_MESSAGES',
    {
      folder: 'inbox',
      top: inboxTop(),
      select: MESSAGE_SELECT,
      received_date_time_ge: since,
      orderby: 'receivedDateTime desc',
    },
    'outlook',
  );

  const raw = parseList<OutlookMessageRaw>(result);
  const emails = raw.map(mapOutlookMessageToEmail);

  return {
    emails,
    syncedAt: new Date().toISOString(),
  };
}
