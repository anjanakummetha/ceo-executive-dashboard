import { NextResponse } from 'next/server';
import {
  addProtein,
  addWater,
  addWorkout,
  getHealthLog,
  getRecentHealthLogs,
  getTodayHealthLog,
  setProtein,
  setSleep,
  setWater,
} from '@/lib/health/store';
import { todayDateString } from '@/lib/time/format';
import type { WorkoutLog } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const recent = searchParams.get('recent');

  try {
    if (recent) {
      const days = parseInt(recent, 10) || 7;
      const logs = await getRecentHealthLogs(days);
      return NextResponse.json({ logs });
    }
    const log = date ? await getHealthLog(date) : await getTodayHealthLog();
    return NextResponse.json({ log });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load health log';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: string;
      protein?: number;
      proteinMode?: 'add' | 'set';
      water?: number;
      waterMode?: 'add' | 'set';
      sleep?: number;
      workout?: WorkoutLog;
    };
    const date = body.date ?? todayDateString();
    let log = await getHealthLog(date);

    if (typeof body.protein === 'number') {
      log =
        body.proteinMode === 'set'
          ? await setProtein(date, body.protein)
          : await addProtein(date, body.protein);
    }
    if (typeof body.water === 'number') {
      log =
        body.waterMode === 'set'
          ? await setWater(date, body.water)
          : await addWater(date, body.water);
    }
    if (typeof body.sleep === 'number') {
      log = await setSleep(date, body.sleep);
    }
    if (body.workout) {
      log = await addWorkout(date, body.workout);
    }

    return NextResponse.json({ log });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save health log';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
