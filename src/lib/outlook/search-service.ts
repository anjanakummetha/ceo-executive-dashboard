import { executeComposioTool } from '@/lib/composio/client';

/**
 * Per-attendee Outlook mail history — the "who introduced them / prior
 * relationship" source. Unlike the inbox snapshot (last ~14 days, inbox only),
 * this searches the WHOLE mailbox (inbox + sent) for a person, so it surfaces
 * the earliest thread — where the introduction actually lives — even when it is
 * months old. Uses the already-allowlisted read-only OUTLOOK_SEARCH_MESSAGES.
 */

export interface OutlookHistoryMessage {
  id: string;
  subject: string;
  preview: string;
  fromName: string;
  fromEmail: string;
  to: string[];
  cc: string[];
  receivedIso: string;
}

interface SearchResource {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  from?: { emailAddress?: { name?: string; address?: string } };
  sender?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
  ccRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
}

interface SearchHit {
  hitId?: string;
  resource?: SearchResource;
}

/** Graph $search responses nest hits under hitsContainers; some wrappers nest under value[]. */
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
  if (Array.isArray(value)) return value.flatMap((entry) => extract(entry));

  return [];
}

function fmtRecipient(r?: { emailAddress?: { name?: string; address?: string } }): string {
  const name = r?.emailAddress?.name?.trim();
  const addr = r?.emailAddress?.address?.trim();
  if (name && addr) return `${name} <${addr}>`;
  return name || addr || '';
}

/** Escapes a value for use inside a KQL quoted phrase. */
function quote(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}

/**
 * Search Kory's whole mailbox for messages involving a person. Read-only.
 * Returns [] on any error (missing Outlook config, throttling) so callers
 * degrade gracefully to inbox-only context.
 */
export async function searchOutlookMessages(
  query: string,
  top = 15,
): Promise<OutlookHistoryMessage[]> {
  try {
    const raw = await executeComposioTool<unknown>(
      'OUTLOOK_SEARCH_MESSAGES',
      { query, top },
      'outlook',
    );
    const hits = parseSearchResults(raw);
    return hits
      .map((h) => {
        const r = h.resource ?? {};
        const fromEA = r.from?.emailAddress ?? r.sender?.emailAddress ?? {};
        return {
          id: r.id ?? h.hitId ?? '',
          subject: r.subject?.trim() || '(no subject)',
          preview: (r.bodyPreview ?? '').replace(/\s+/g, ' ').trim().slice(0, 240),
          fromName: fromEA.name?.trim() || '',
          fromEmail: fromEA.address?.trim().toLowerCase() || '',
          to: (r.toRecipients ?? []).map(fmtRecipient).filter(Boolean),
          cc: (r.ccRecipients ?? []).map(fmtRecipient).filter(Boolean),
          receivedIso: r.receivedDateTime ?? '',
        };
      })
      .filter((m) => m.id && (m.fromEmail || m.subject !== '(no subject)'));
  } catch (e) {
    console.warn('[outlook] mail history search failed:', e);
    return [];
  }
}

/** Build the KQL query for a person: prefer the exact address, fall back to name. */
export function historyQueryForPerson(name: string, email?: string): string | null {
  if (email && email.includes('@')) {
    return `participants:${quote(email)} OR ${quote(email)}`;
  }
  const trimmed = name.trim();
  if (trimmed.length > 2 && trimmed.includes(' ')) return quote(trimmed);
  return null;
}
