import { promises as fs } from 'fs';
import path from 'path';
import type { HealthLog, WorkoutLog } from '@/lib/data';
import { todayDateString } from '@/lib/time/format';
import { dataDir } from '@/lib/paths';

const DATA_DIR = dataDir();
const DATA_FILE = path.join(DATA_DIR, 'health-logs.json');

const DEFAULT_GOALS = {
  proteinGoal: 180,
  waterGoal: 100,
  calorieGoal: 2400,
  sleepGoal: 8,
  stepsGoal: 10000,
};

export interface HealthStore {
  logs: Record<string, HealthLog>;
}

async function ensureStore(): Promise<HealthStore> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw) as HealthStore;
  } catch {
    return { logs: {} };
  }
}

async function saveStore(store: HealthStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function emptyLog(date: string): HealthLog {
  return {
    id: date,
    date,
    protein: 0,
    proteinGoal: DEFAULT_GOALS.proteinGoal,
    calories: 0,
    calorieGoal: DEFAULT_GOALS.calorieGoal,
    water: 0,
    waterGoal: DEFAULT_GOALS.waterGoal,
    sleep: 0,
    sleepGoal: DEFAULT_GOALS.sleepGoal,
    steps: 0,
    stepsGoal: DEFAULT_GOALS.stepsGoal,
  };
}

export async function getHealthLog(date: string): Promise<HealthLog> {
  const store = await ensureStore();
  return store.logs[date] ?? emptyLog(date);
}

export async function getTodayHealthLog(): Promise<HealthLog> {
  return getHealthLog(todayDateString());
}

/** Oldest → newest (for charts). */
export async function getRecentHealthLogs(days = 7): Promise<HealthLog[]> {
  const store = await ensureStore();
  const today = todayDateString();
  const results: HealthLog[] = [];
  const base = new Date(`${today}T12:00:00`);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    results.push(store.logs[key] ?? emptyLog(key));
  }
  return results;
}

export async function addProtein(date: string, grams: number): Promise<HealthLog> {
  const store = await ensureStore();
  const log = store.logs[date] ?? emptyLog(date);
  log.protein = Math.max(0, log.protein + grams);
  store.logs[date] = log;
  await saveStore(store);
  return log;
}

export async function setProtein(date: string, grams: number): Promise<HealthLog> {
  const store = await ensureStore();
  const log = store.logs[date] ?? emptyLog(date);
  log.protein = Math.max(0, grams);
  store.logs[date] = log;
  await saveStore(store);
  return log;
}

export async function addWater(date: string, ounces: number): Promise<HealthLog> {
  const store = await ensureStore();
  const log = store.logs[date] ?? emptyLog(date);
  log.water = Math.max(0, log.water + ounces);
  store.logs[date] = log;
  await saveStore(store);
  return log;
}

export async function setWater(date: string, ounces: number): Promise<HealthLog> {
  const store = await ensureStore();
  const log = store.logs[date] ?? emptyLog(date);
  log.water = Math.max(0, ounces);
  store.logs[date] = log;
  await saveStore(store);
  return log;
}

export async function addWorkout(date: string, workout: WorkoutLog): Promise<HealthLog> {
  const store = await ensureStore();
  const log = store.logs[date] ?? emptyLog(date);
  log.workout = workout;
  store.logs[date] = log;
  await saveStore(store);
  return log;
}

export async function setSleep(date: string, hours: number): Promise<HealthLog> {
  const store = await ensureStore();
  const log = store.logs[date] ?? emptyLog(date);
  log.sleep = Math.max(0, hours);
  store.logs[date] = log;
  await saveStore(store);
  return log;
}
