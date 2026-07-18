import { NextResponse } from 'next/server';
import { generateInboxAnalysis } from '@/lib/ai/generate';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  try {
    const snapshot = await loadTodaySnapshot();
    const emails = await generateInboxAnalysis(snapshot.emails);
    return NextResponse.json({ emails, source: 'hermes', analyzed: Math.min(15, emails.length) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Inbox analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
