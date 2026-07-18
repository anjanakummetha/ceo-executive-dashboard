import { NextResponse } from 'next/server';
import { getComposioConfig } from '@/lib/composio/client';
import { resolveProjectGid } from '@/lib/asana/service';

export const dynamic = 'force-dynamic';

/** Lightweight health check for Composio + Asana project resolution. */
export async function GET() {
  try {
    getComposioConfig('asana');
    const projectGid = await resolveProjectGid();
    return NextResponse.json({
      ok: true,
      connectedAccountId: process.env.COMPOSIO_CONNECTED_ACCOUNT_ID,
      projectGid,
      projectName: process.env.ASANA_PROJECT_NAME ?? 'Kory NON-IFG',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Asana not configured';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
