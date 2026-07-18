import { NextResponse } from 'next/server';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';
import { fetchInboxMessages } from '@/lib/outlook/mail-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    if (process.env.USE_MOCK_DATA !== 'true' && process.env.COMPOSIO_API_KEY) {
      const snapshot = await loadTodaySnapshot();
      return NextResponse.json({ emails: snapshot.emails, syncedAt: snapshot.syncedAt });
    }
    const result = await fetchInboxMessages();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load inbox';
    console.error('[api/outlook/messages]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
