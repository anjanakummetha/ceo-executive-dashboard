import { NextResponse } from 'next/server';
import { generateInboxAnalysis } from '@/lib/ai/generate';
import { clearAiCache } from '@/lib/ai/cache-store';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    if (force) clearAiCache('inbox', 'batch');
    const snapshot = await loadTodaySnapshot(force);
    const emails = await generateInboxAnalysis(snapshot.emails);
    return NextResponse.json({ emails, source: 'hermes', analyzed: Math.min(15, emails.length) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Inbox analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
