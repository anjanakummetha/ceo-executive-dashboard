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

    const result = await fetchLinkedInNotifications();
    return NextResponse.json({ ...result, source: 'composio' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load LinkedIn';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
