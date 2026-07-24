import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { todayMtDateString } from '@/lib/outlook/time';
import { dataPath } from '@/lib/paths';

const AI_DIR = dataPath('ai-cache');

function pathFor(kind: string, id: string): string {
  const day = todayMtDateString();
  return join(AI_DIR, `${day}-${kind}-${id}.json`);
}

function ensureDir() {
  if (!existsSync(AI_DIR)) mkdirSync(AI_DIR, { recursive: true });
}

export function readAiCache<T>(kind: string, id: string): T | null {
  ensureDir();
  const p = pathFor(kind, id);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function writeAiCache<T>(kind: string, id: string, data: T): void {
  ensureDir();
  writeFileSync(pathFor(kind, id), JSON.stringify(data, null, 2), 'utf8');
}

/** Drop today's cache file for one AI surface so the next call regenerates. */
export function clearAiCache(kind: string, id: string): void {
  const p = pathFor(kind, id);
  try {
    if (existsSync(p)) unlinkSync(p);
  } catch {
    /* ignore */
  }
}
