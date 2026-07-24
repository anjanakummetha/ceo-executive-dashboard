import type { TodaySnapshot } from '@/lib/sync/today-snapshot';

export function prioritiesPrompt(snapshot: TodaySnapshot): string {
  return `You are Hermes, Kory Mitchell's executive AI at Iconic Founders Group.
Analyze today's snapshot and return ONLY valid JSON (no markdown):
{
  "items": [
    {
      "id": "p1",
      "title": "string",
      "source": "email|calendar|asana|linkedin|personal",
      "sourceLabel": "string",
      "why": "string",
      "action": "string",
      "timeEstimate": "string",
      "scores": { "urgency": 0-10, "strategic": 0-10, "revenue": 0-10, "relationship": 0-10, "deadlineRisk": 0-10 },
      "compositeScore": 0-100,
      "fireProbability": 0-100,
      "sentiment": "critical|negative|neutral|positive",
      "flagged": boolean,
      "completed": false
    }
  ]
}
Rules: 5-8 items max, sorted by compositeScore desc. Use real names/events from data. Mountain Time. Use only data present in DATA; do not invent CRM/deal items.

DATA:
${JSON.stringify(snapshot, null, 0).slice(0, 28000)}`;
}

export function dailyBriefingPrompt(snapshot: TodaySnapshot, overdue: { title: string; source: string; daysOverdue: number; priority: string }[]): string {
  return `You are Hermes generating Kory Mitchell's CEO morning briefing for Iconic Founders Group.
Return ONLY valid JSON:
{
  "keyInsights": ["3-6 bullet strings"],
  "conversationalBrief": "2-4 paragraphs, direct, actionable, Mountain Time",
  "weatherCondition": "Unknown or brief note",
  "temperature": "",
  "emailDraft": {
    "subject": "CEO Daily Briefing — {date}",
    "bodyText": "plain text email version",
    "bodyHtml": "simple HTML with <p> and <ul> only"
  }
}
Include: meeting count, top priorities, overdue tasks, urgent emails. Professional tone for Kory. Use only data present below; do not invent deals or tasks.

Overdue tasks: ${JSON.stringify(overdue)}

DATA:
${JSON.stringify(snapshot, null, 0).slice(0, 24000)}`;
}

export function attendeeIntelPrompt(
  people: Array<{
    name: string;
    email?: string;
    meetingTitle: string;
    meetingTime: string;
    recurring: boolean;
    companyGuess: string;
    firstContact:
      | { date: string; from: string; to: string[]; cc: string[]; subject: string; preview: string }
      | null;
    snippets: Array<{
      subject: string;
      preview: string;
      direction: string;
      date?: string;
      from?: string;
      to?: string[];
      cc?: string[];
    }>;
  }>,
  meetings: TodaySnapshot['meetings'],
): string {
  return `You are Hermes preparing Kory Mitchell (CEO, Iconic Founders) for today's meetings.

Each person has PROVIDED_EMAIL_CONTEXT drawn from Kory's real Outlook mailbox (inbox + sent):
"firstContact" is the EARLIEST message between them and Kory; "snippets" is the chronological trail
(earliest first). Each message lists "from", "to", "cc" and a "direction" (from_them = they emailed
Kory, to_them = Kory emailed them, other = a third party). This is your ONLY source for how they know
Kory — never invent it.

For NON-recurring attendees:
- RESEARCH their public professional background with web_search (current role, company, career history,
  education, board seats, recent public news). Prioritize LinkedIn, the company site, reputable news.
  Use name + company/email domain to disambiguate. Put verified public findings in "bio".
- DETERMINE "introducedBy" from firstContact and the earliest snippets: if a third party sent or was
  CC'd on the first email, or is named in it ("X suggested I reach out", "great connecting via X",
  "X made the intro", "looping in X"), name that person. If Kory (direction to_them) or the attendee
  (direction from_them) started the thread directly with no third party, use "Direct outreach". Only use
  "Unknown" when there is genuinely no email history at all.
- "relationshipContext": 1-2 sentences on the prior relationship and email history, including the first
  contact date and what it was about.

For RECURRING attendees (recurring=true): SKIP web research. Set "bio" to "". Set "relationshipContext"
to a short note like "Recurring meeting." Set "introducedBy" to "Unknown" unless the intro is clearly in
the email history. Do not spend effort here beyond the action check below.

For ALL attendees, set "actionNeeded" and "actionNote": actionNeeded=true ONLY if the email history shows
something concretely awaiting Kory's reply or decision (an open question, a request, a document/approval
pending, an unanswered ask). "actionNote" is one short line describing it. Otherwise actionNeeded=false
and actionNote="".

If you cannot verify a public fact, omit it and lower "confidence". No email context AND no findable
public info => confidence "low".

Return ONLY valid JSON:
{
  "people": [
    {
      "name": "Full Name",
      "bio": "2-3 sentences (empty string for recurring attendees)",
      "introducedBy": "Person who connected them to Kory, or 'Direct outreach', or 'Unknown'",
      "relationshipContext": "1-2 sentences grounded in the email history, including first contact",
      "angle": "One sentence on why this meeting matters for Kory (empty for recurring)",
      "conversationTip": "one actionable line for today's meeting",
      "actionNeeded": true,
      "actionNote": "one line, or empty string",
      "confidence": "high|medium|low"
    }
  ]
}

PEOPLE_WITH_EMAIL_CONTEXT:
${JSON.stringify(people, null, 0).slice(0, 30000)}

MEETINGS:
${JSON.stringify(meetings.filter((m) => (m.scheduleKind ?? 'meeting') === 'meeting'), null, 0).slice(0, 8000)}`;
}

export function meetingPrepPrompt(meeting: TodaySnapshot['meetings'][0]): string {
  return `You are Hermes. Meeting prep for Kory Mitchell (CEO, Iconic Founders).
Return ONLY valid JSON:
{
  "aiTalkingPoints": ["3-5 bullets"],
  "aiRelationshipContext": "1 short paragraph",
  "aiRecentNews": "1-2 sentences or 'No recent public news identified.'"
}

MEETING:
${JSON.stringify(meeting, null, 0)}`;
}

export function inboxAnalysisPrompt(
  emails: Array<{ id: string; sender: string; subject: string; preview: string; unread: boolean }>,
): string {
  return `You are Hermes triaging Kory Mitchell's Outlook inbox.
Return ONLY valid JSON:
{
  "emails": [
    {
      "id": "same id as input",
      "aiSummary": "1-2 sentences",
      "aiCategory": "urgent|board|team|personal|finance|pr|legal|sales",
      "aiTriage": "urgent-reply|revenue|emotionally-sensitive|delegate|quick-reply|deep-response|ignore|fyi",
      "sentimentScore": -1 to 1,
      "draftReply": "optional short draft or empty string"
    }
  ]
}
Process each email in the list. Max ${emails.length} items.

EMAILS:
${JSON.stringify(emails, null, 0)}`;
}
