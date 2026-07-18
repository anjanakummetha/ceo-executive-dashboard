import { NextResponse } from 'next/server';
import { fetchTravelFamilyEvents } from '@/lib/outlook/travel-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await fetchTravelFamilyEvents();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load travel & family events';
    console.error('[api/outlook/travel]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
