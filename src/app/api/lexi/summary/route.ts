import { NextResponse } from 'next/server';
import { cacheThrough, CACHE_TTL } from '@/lib/cache/ttl-cache';
import { fetchLexiSummary } from '@/lib/lexi/service';

export const dynamic = 'force-dynamic';

/** Merged read-only view of the Lexi agent (localhost + SQLite; zero Composio cost). */
export async function GET() {
  const summary = await cacheThrough('lexi:summary', CACHE_TTL.lexi, fetchLexiSummary);
  return NextResponse.json(summary);
}
