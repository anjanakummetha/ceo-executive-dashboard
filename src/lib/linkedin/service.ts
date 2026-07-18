import { executeComposioTool } from '@/lib/composio/client';
import type { LinkedInMessage } from '@/lib/data';
import { formatRelativeTime } from '@/lib/time/format';

const AVATAR_COLORS = ['#0a66c2', '#4a9ed6', '#c9a044', '#4caf82', '#9b59b6'];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'LI';
}

interface SearchHit {
  hitId?: string;
  resource?: {
    id?: string;
    subject?: string;
    bodyPreview?: string;
    receivedDateTime?: string;
    isRead?: boolean;
    from?: { emailAddress?: { name?: string; address?: string } };
  };
}

function parseSearchResults(payload: unknown): SearchHit[] {
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;

  const extract = (obj: unknown): SearchHit[] => {
    if (!obj || typeof obj !== 'object') return [];
    const o = obj as { hitsContainers?: { hits?: SearchHit[] }[] };
    if (!Array.isArray(o.hitsContainers)) return [];
    return o.hitsContainers.flatMap((c) => c.hits ?? []);
  };

  const top = extract(payload);
  if (top.length) return top;

  const value = p.value;
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extract(entry));
  }

  return [];
}

/** LinkedIn email from Outlook — must be a DM/InMail alert, not digests or job alerts. */
function isLinkedInMessageNotification(hit: SearchHit): boolean {
  const r = hit.resource ?? {};
  const from = r.from?.emailAddress?.address?.toLowerCase() ?? '';
  const fromName = r.from?.emailAddress?.name?.toLowerCase() ?? '';
  const subject = r.subject?.toLowerCase() ?? '';
  const preview = r.bodyPreview?.toLowerCase() ?? '';
  const blob = `${subject} ${preview}`;

  const isLinkedInEmail =
    from.includes('linkedin') ||
    fromName.includes('linkedin') ||
    subject.includes('linkedin');
  if (!isLinkedInEmail) return false;

  const exclude =
    /job alert|apply today|sales navigator|weekly performance|getting noticed|commented on your post|leads from|posted this week|top new accounts|linkedin news|guide to creating|linkedin update.*engage|virtual assistant schools/i;
  if (exclude.test(blob) || exclude.test(fromName)) return false;

  const genericSender =
    /^(linkedin job alerts|linkedin news|linkedin sales navigator|linkedin guide)/i.test(
      fromName.trim(),
    );
  if (genericSender) return false;

  const messageSignal =
    /message(s)? await(s)? your response|new message(s)? await|sent you a message|sent you an inmail|unread message|you have \d+ new message|message notification/i;
  if (messageSignal.test(blob)) return true;

  // Named contact + message-style subject (e.g. "Jon sent you a message")
  if (
    fromName &&
    !/^linkedin(\s|$)/i.test(r.from?.emailAddress?.name ?? '') &&
    /message/i.test(subject) &&
    !/job|invitation to connect|follow/i.test(blob)
  ) {
    return true;
  }

  return false;
}

function mapHitToMessage(hit: SearchHit, index: number): LinkedInMessage {
  const r = hit.resource ?? {};
  const senderName = r.from?.emailAddress?.name ?? 'LinkedIn';
  const preview = r.bodyPreview ?? r.subject ?? 'New message on LinkedIn';

  return {
    id: r.id ?? hit.hitId ?? `li-${index}`,
    sender: senderName.replace(/ via LinkedIn/i, '').trim() || 'LinkedIn',
    senderInitials: initials(senderName),
    senderColor: hashColor(senderName),
    role: 'Message notification',
    company: 'LinkedIn',
    preview: preview.slice(0, 160),
    time: r.receivedDateTime
      ? formatRelativeTime(r.receivedDateTime)
      : 'Recently',
    unread: !r.isRead,
    flagged: false,
    connectionDegree: 1,
  };
}

/**
 * LinkedIn's Composio toolkit has no DM API. We surface DM/InMail alert emails
 * from Outlook only (not job alerts, news, or weekly digests).
 */
export async function fetchLinkedInNotifications(): Promise<{
  messages: LinkedInMessage[];
  profileName: string | null;
  syncedAt: string;
}> {
  let profileName: string | null = null;

  try {
    const profile = await executeComposioTool<{
      localizedFirstName?: string;
      localizedLastName?: string;
    }>('LINKEDIN_GET_MY_INFO', {}, 'linkedin');
    const first = profile?.localizedFirstName ?? '';
    const last = profile?.localizedLastName ?? '';
    profileName = `${first} ${last}`.trim() || null;
  } catch (e) {
    console.warn('[linkedin] profile check failed:', e);
  }

  const search = await executeComposioTool<unknown>(
    'OUTLOOK_SEARCH_MESSAGES',
    {
      query:
        'from:linkedin AND ("message awaits" OR "sent you a message" OR "new message" OR "message notification")',
      top: 40,
    },
    'outlook',
  );

  const hits = parseSearchResults(search).filter(isLinkedInMessageNotification);
  const messages = hits.map(mapHitToMessage).slice(0, 20);

  return {
    messages,
    profileName,
    syncedAt: new Date().toISOString(),
  };
}
