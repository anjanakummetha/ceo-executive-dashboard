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
  relationshipContext: string;
  conversationTip: string;
  confidence: IntelConfidence;
}

export interface AttendeeIntelBundle {
  people: AttendeeIntel[];
  generatedAt: string;
  source: 'hermes' | 'cache';
}
