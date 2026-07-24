import { NextResponse } from 'next/server';
import { generatePriorities } from '@/lib/ai/generate';
import { clearAiCache } from '@/lib/ai/cache-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.get('refresh') === '1') {
      clearAiCache('priorities', 'all');
    }
    const items = await generatePriorities();
    return NextResponse.json({ items, source: 'hermes' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Priority generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
