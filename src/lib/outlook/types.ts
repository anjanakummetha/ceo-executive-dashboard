export interface OutlookCalendar {
  id: string;
  name: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
}

export interface OutlookEventRaw {
  id: string;
  subject?: string;
  bodyPreview?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  location?: { displayName?: string };
  isAllDay?: boolean;
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
  webLink?: string;
  iCalUId?: string;
  categories?: string[];
  attendees?: Array<{
    emailAddress?: { name?: string; address?: string };
    type?: string;
  }>;
}

export interface OutlookRecipient {
  emailAddress?: { name?: string; address?: string };
}

export interface OutlookMessageRaw {
  id: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  flag?: { flagStatus?: string };
  webLink?: string;
  from?: OutlookRecipient;
  toRecipients?: OutlookRecipient[];
}

export interface DashboardCalendarEvent {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  calendarId: string;
  calendarName: string;
  location: string;
  isAllDay: boolean;
  isOnline: boolean;
  onlineMeetingUrl?: string;
  webLink?: string;
  bodyPreview?: string;
  categories: string[];
  attendees: Array<{ name: string; email?: string; initials: string; color: string }>;
}
