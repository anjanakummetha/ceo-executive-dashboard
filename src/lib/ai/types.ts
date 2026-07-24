export type IntelConfidence = 'high' | 'medium' | 'low';

export interface EmailThreadSnippet {
  subject: string;
  preview: string;
  time: string;
  direction: 'from_them' | 'to_them';
}

export interface AttendeeEmailContext {
  email: string;
  companyGuess: string;
  messageCount: number;
  snippets: EmailThreadSnippet[];
}

export interface AttendeeIntel {
  name: string;
  email?: string;
  meetingTitle: string;
  meetingTime: string;
  emailContext: AttendeeEmailContext | null;
  bio: string;
  introducedBy: string;
  relationshipContext: string;
  angle: string;
  conversationTip: string;
  confidence: IntelConfidence;
  /** Every meeting this person is in today is a recurring series — skip deep research. */
  recurring?: boolean;
  /** True when the email history shows something awaiting Kory's reply/decision. */
  actionNeeded?: boolean;
  actionNote?: string;
}

export interface AttendeeIntelBundle {
  people: AttendeeIntel[];
  generatedAt: string;
  source: 'hermes' | 'cache';
}
