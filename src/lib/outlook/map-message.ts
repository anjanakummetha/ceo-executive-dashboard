import type { Email } from '@/lib/data';
import { HERMES_SUMMARY_PLACEHOLDER } from '@/lib/data';
import { formatRelativeTime } from '@/lib/time/format';
import type { OutlookMessageRaw, OutlookRecipient } from './types';

const AVATAR_COLORS = ['#c9a044', '#4a9ed6', '#4caf82', '#e09a44', '#9b59b6', '#e05252'];

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
    .toUpperCase() || '?';
}

function formatRecipient(recipients: OutlookRecipient[] | undefined): string {
  if (!recipients?.length) return '—';
  return recipients
    .map((r) => r.emailAddress?.name || r.emailAddress?.address || '')
    .filter(Boolean)
    .join(', ');
}

export function mapOutlookMessageToEmail(msg: OutlookMessageRaw): Email {
  const senderAddress = msg.from?.emailAddress?.address?.trim() ?? '';
  const senderName =
    msg.from?.emailAddress?.name?.trim() ||
    senderAddress ||
    'Unknown';
  const recipient = formatRecipient(msg.toRecipients);
  const flagged = msg.flag?.flagStatus === 'flagged';

  return {
    id: msg.id,
    sender: senderName,
    senderEmail: senderAddress || undefined,
    senderInitials: initials(senderName),
    senderColor: hashColor(senderName),
    recipient,
    subject: msg.subject?.trim() || '(No subject)',
    preview: (msg.bodyPreview ?? '').replace(/\s+/g, ' ').trim().slice(0, 280),
    time: msg.receivedDateTime ? formatRelativeTime(msg.receivedDateTime) : 'Recently',
    unread: !msg.isRead,
    flagged,
    priority: 'medium',
    labels: [],
    aiCategory: 'team',
    aiTriage: 'fyi',
    aiSummary: HERMES_SUMMARY_PLACEHOLDER,
    sentimentScore: 0,
    webLink: msg.webLink,
  };
}
