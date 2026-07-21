import { NextResponse } from 'next/server';
import { fetchLinkedInNotifications } from '@/lib/linkedin/service';
import { linkedInMessages as mockMessages } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return NextResponse.json({
        messages: mockMessages,
        profileName: 'Kory Mitchell',
        syncedAt: new Date().toISOString(),
        source: 'mock',
      });
    }

    // LinkedIn on Composio only exposes profile info (no message inbox); if the
    // connection is unset or the call fails, degrade quietly rather than erroring.
    if (!process.env.COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID) {
      return NextResponse.json({ available: false, messages: [], reason: 'not connected' });
    }
    const result = await fetchLinkedInNotifications();
    return NextResponse.json({ ...result, available: true, source: 'composio' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load LinkedIn';
    return NextResponse.json({ available: false, messages: [], reason: message });
  }
}
