import { NextResponse } from 'next/server';
import { generateDailyBriefing, getOrGenerateDailyBriefing } from '@/lib/ai/generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const generate = new URL(request.url).searchParams.get('generate') === '1';
    const record = generate ? await generateDailyBriefing() : await getOrGenerateDailyBriefing();
    return NextResponse.json({
      briefing: record,
      emailWouldSendTo: record.emailDraft.to,
      emailSent: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Briefing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Simulate 4:45 AM MT cron — generates briefing + email draft, does NOT send */
export async function POST() {
  try {
    const record = await generateDailyBriefing();
    return NextResponse.json({
      ok: true,
      briefing: record,
      emailDraft: record.emailDraft,
      emailSent: false,
      note: 'Email draft prepared only. Set BRIEFING_SEND_ENABLED=true and wire SMTP to send.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Briefing generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
