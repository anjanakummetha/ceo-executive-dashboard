import { NextResponse } from 'next/server';
import { loadTodaySnapshot } from '@/lib/sync/today-snapshot';
import { fetchAsanaProjectMeta, syncAsanaBoard } from '@/lib/asana/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    if (process.env.USE_MOCK_DATA !== 'true' && process.env.COMPOSIO_API_KEY) {
      const snapshot = await loadTodaySnapshot();
      const project = await fetchAsanaProjectMeta();
      return NextResponse.json({
        tasks: snapshot.tasks,
        project,
        syncedAt: snapshot.syncedAt,
      });
    }
    const result = await syncAsanaBoard();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync Asana';
    console.error('[api/asana/tasks]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
