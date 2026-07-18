import { fetchAsanaTasksFromProject } from '@/lib/asana/service';
import { cacheThrough, CACHE_TTL } from '@/lib/cache/ttl-cache';
import type { AsanaTask, Email, Meeting } from '@/lib/data';
import { fetchLinkedInNotifications } from '@/lib/linkedin/service';
import { fetchTodayMeetingsFromOutlook } from '@/lib/outlook/calendar-service';
import { fetchInboxMessages } from '@/lib/outlook/mail-service';
import { toMeeting } from '@/lib/outlook/map-event';
import { todayMtDateString } from '@/lib/outlook/time';

export interface TodaySnapshot {
  date: string;
  syncedAt: string;
  meetings: Meeting[];
  tasks: AsanaTask[];
  emails: Email[];
  linkedInUnread: number;
  meetingCount: number;
}

export async function loadTodaySnapshot(force = false): Promise<TodaySnapshot> {
  const date = todayMtDateString();
  const key = `snapshot:${date}`;

  if (force) {
    const { cacheInvalidate } = await import('@/lib/cache/ttl-cache');
    cacheInvalidate('snapshot:');
  }

  return cacheThrough(key, CACHE_TTL.meetings, async () => {
    const [events, tasks, inbox, linkedIn] = await Promise.all([
      fetchTodayMeetingsFromOutlook(),
      fetchAsanaTasksFromProject(),
      fetchInboxMessages().then((r) => r.emails),
      fetchLinkedInNotifications().then((r) => r.messages.filter((m) => m.unread).length),
    ]);

    const meetings = events.map(toMeeting);
    const meetingCount = meetings.filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting').length;

    return {
      date,
      syncedAt: new Date().toISOString(),
      meetings,
      tasks,
      emails: inbox,
      linkedInUnread: linkedIn,
      meetingCount,
    };
  });
}
