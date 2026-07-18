import type { Meeting } from '@/lib/data';
import type { AttendeeIntel } from '@/lib/ai/types';
import { isKoryAttendee } from '@/lib/outlook/meeting-people';

function intelKey(name: string, email?: string): string {
  return email?.trim().toLowerCase() || name.trim().toLowerCase();
}

export function intelByKey(people: AttendeeIntel[]): Map<string, AttendeeIntel> {
  const map = new Map<string, AttendeeIntel>();
  for (const p of people) {
    map.set(intelKey(p.name, p.email), p);
  }
  return map;
}

/** No extra Hermes call — derived from cached attendee intel + email snippets. */
export function buildMeetingTalkingPoints(
  meeting: Meeting,
  byIntel: Map<string, AttendeeIntel>,
): string[] {
  const points: string[] = [];
  for (const a of meeting.attendees) {
    if (isKoryAttendee(a.name)) continue;
    const intel = byIntel.get(intelKey(a.name, a.email));
    if (!intel) continue;
    if (intel.conversationTip) {
      points.push(`${a.name}: ${intel.conversationTip}`);
    }
    for (const s of intel.emailContext?.snippets?.slice(0, 2) ?? []) {
      const dir = s.direction === 'from_them' ? 'They wrote' : 'You wrote';
      points.push(`${a.name} — ${dir}: “${s.subject}”`);
    }
  }
  return points.slice(0, 6);
}

export function buildMeetingRelationshipSummary(
  meeting: Meeting,
  byIntel: Map<string, AttendeeIntel>,
): string {
  const parts: string[] = [];
  for (const a of meeting.attendees) {
    if (isKoryAttendee(a.name)) continue;
    const intel = byIntel.get(intelKey(a.name, a.email));
    if (intel?.relationshipContext) {
      parts.push(`${a.name}: ${intel.relationshipContext}`);
    }
  }
  return parts.join(' ');
}
