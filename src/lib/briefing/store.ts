import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { dataDir } from '@/lib/paths';
import type { DailyBriefing } from '@/lib/data';
import type { AIPriorityItem } from '@/lib/data';
import { todayMtDateString } from '@/lib/outlook/time';

export interface DailyBriefingRecord extends DailyBriefing {
  /** ISO timestamp — intended 4:45 AM MT generation window */
  generatedAtIso: string;
  emailDraft: {
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml: string;
  };
  priorities?: AIPriorityItem[];
  source: 'hermes' | 'fallback';
}

const DATA_DIR = dataDir();
const BRIEFING_PATH = join(DATA_DIR, 'daily-briefing.json');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function readDailyBriefing(): DailyBriefingRecord | null {
  ensureDir();
  if (!existsSync(BRIEFING_PATH)) return null;
  try {
    return JSON.parse(readFileSync(BRIEFING_PATH, 'utf8')) as DailyBriefingRecord;
  } catch {
    return null;
  }
}

export function writeDailyBriefing(record: DailyBriefingRecord): void {
  ensureDir();
  writeFileSync(BRIEFING_PATH, JSON.stringify(record, null, 2), 'utf8');
}

export function briefingForToday(): DailyBriefingRecord | null {
  const record = readDailyBriefing();
  if (!record) return null;
  const today = todayMtDateString();
  if (record.date !== today) return null;
  return record;
}

export function formatBriefingDeliveryLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Denver',
    timeZoneName: 'short',
  });
}

export function defaultEmailRecipient(): string {
  return process.env.BRIEFING_EMAIL_TO || process.env.KORY_EMAIL || 'kory@iconicfounders.com';
}
