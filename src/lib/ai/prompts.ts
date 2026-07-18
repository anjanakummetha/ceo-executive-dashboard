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
Rules: 5-8 items max, sorted by compositeScore desc. Use real names/events from data. Mountain Time. No HubSpot unless in data.

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
Include: meeting count, top priorities, overdue tasks, urgent emails. Professional tone for Kory. Do not invent HubSpot deals.

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
    emailContext: {
      companyGuess: string;
      snippets: Array<{ subject: string; preview: string; direction: string }>;
    } | null;
  }>,
  meetings: TodaySnapshot['meetings'],
): string {
  return `You are Hermes preparing Kory Mitchell (CEO, Iconic Founders) for today's meetings.
Use ONLY facts in PROVIDED_EMAIL_CONTEXT and meeting data. Do not invent employers, deals, or news.
If email context is empty, say what is unknown and set confidence to "low".

Return ONLY valid JSON:
{
  "people": [
    {
      "name": "Full Name",
      "bio": "2-3 sentences grounded in email/meeting facts",
      "relationshipContext": "1-2 sentences on email thread relationship with Kory",
      "conversationTip": "one actionable line for today's meeting",
      "confidence": "high|medium|low"
    }
  ]
}

PEOPLE_WITH_EMAIL_CONTEXT:
${JSON.stringify(people, null, 0).slice(0, 22000)}

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
