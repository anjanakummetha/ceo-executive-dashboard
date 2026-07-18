import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { todayMtDateString } from '@/lib/outlook/time';

const AI_DIR = join(process.cwd(), 'data', 'ai-cache');

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
