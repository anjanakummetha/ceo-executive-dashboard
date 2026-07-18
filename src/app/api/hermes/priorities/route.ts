import { NextResponse } from 'next/server';
import { generatePriorities } from '@/lib/ai/generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  try {
    const items = await generatePriorities();
    return NextResponse.json({ items, source: 'hermes' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Priority generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
