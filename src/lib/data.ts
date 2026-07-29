export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskSource = 'asana' | 'email' | 'linkedin' | 'calendar' | 'personal';
export type EmailCategory = 'urgent' | 'board' | 'team' | 'personal' | 'finance' | 'pr' | 'legal' | 'sales';
export type EmailTriage = 'urgent-reply' | 'revenue' | 'emotionally-sensitive' | 'delegate' | 'quick-reply' | 'deep-response' | 'ignore' | 'fyi';
export type RelationshipHealth = 'strong' | 'good' | 'cooling' | 'cold';

// ─── EMAIL ─────────────────────────────────────────────────────────────────

export interface Email {
  id: string;
  sender: string;
  /** SMTP address when available from Outlook */
  senderEmail?: string;
  senderInitials: string;
  senderColor: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  flagged: boolean;
  priority: Priority;
  labels: string[];
  aiCategory: EmailCategory;
  aiTriage: EmailTriage;
  aiSummary: string;
  sentimentScore: number; // -1 (negative) to +1 (positive)
  draftReply?: string;
  delegateTo?: string;
  /** Primary To: recipient (live Outlook inbox). */
  recipient?: string;
  /** Open in Outlook on the web. */
  webLink?: string;
}

export const HERMES_SUMMARY_PLACEHOLDER =
  'AI summary not set up yet — Hermes not connected.';

// ─── MEETINGS ──────────────────────────────────────────────────────────────

export interface Attendee {
  name: string;
  email?: string;
  role: string;
  company: string;
  initials: string;
  color: string;
  bio?: string;
}

export type ScheduleKind = 'meeting' | 'other';

export interface Meeting {
  id: string;
  title: string;
  time: string;
  duration: string;
  attendees: Attendee[];
  location: string;
  type: 'video' | 'in-person' | 'phone';
  scheduleKind?: ScheduleKind;
  /** True for occurrences/exceptions/masters of a recurring Outlook series. */
  isRecurring?: boolean;
  startIso?: string;
  calendarName?: string;
  notes?: string;
  agenda?: string;
  flagged: boolean;
  aiTalkingPoints?: string[];
  aiRelationshipContext?: string;
  aiRecentNews?: string;
}

// ─── CALLS ─────────────────────────────────────────────────────────────────

export interface Call {
  id: string;
  contact: string;
  contactInitials: string;
  contactColor: string;
  company: string;
  role: string;
  type: 'incoming' | 'outgoing' | 'follow-up' | 'scheduled';
  time: string;
  duration?: string;
  notes: string;
  flagged: boolean;
  completed: boolean;
}

// ─── ASANA ─────────────────────────────────────────────────────────────────

export interface AsanaTask {
  id: string;
  title: string;
  /** The Asana board, e.g. "IFG Tasks" or "Kory NON-IFG". */
  project: string;
  /** The column within that board, e.g. "Personal", "YPO", "General". */
  section?: string;
  assignee: string;
  dueDate: string;
  priority: Priority;
  status: 'overdue' | 'due-today' | 'in-progress' | 'upcoming';
  flagged: boolean;
  subtasks?: number;
  completedSubtasks?: number;
}

// ─── LINKEDIN ──────────────────────────────────────────────────────────────

export interface LinkedInMessage {
  id: string;
  sender: string;
  senderInitials: string;
  senderColor: string;
  role: string;
  company: string;
  preview: string;
  time: string;
  unread: boolean;
  flagged: boolean;
  connectionDegree: 1 | 2 | 3;
}

// ─── HEALTH ────────────────────────────────────────────────────────────────

export interface WorkoutLog {
  type: string;
  duration: number;
  intensity: 'light' | 'moderate' | 'intense';
  exercises?: string[];
  notes?: string;
}

export interface HealthLog {
  id: string;
  date: string;
  protein: number;
  proteinGoal: number;
  calories: number;
  calorieGoal: number;
  workout?: WorkoutLog;
  water: number;
  waterGoal: number;
  sleep: number;
  sleepGoal: number;
  weight?: number;
  steps?: number;
  stepsGoal?: number;
}

// ─── TRAVEL ────────────────────────────────────────────────────────────────

export interface TravelSegment {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'train' | 'restaurant' | 'other';
  title: string;
  /** Display label, e.g. "Thu, Jun 5" or range */
  date: string;
  /** YYYY-MM-DD for sorting / grouping */
  sortDate?: string;
  time: string;
  endTime?: string;
  confirmationCode: string;
  status: 'confirmed' | 'pending' | 'checked-in' | 'completed';
  details: string;
  location?: string;
  provider?: string;
  notes?: string;
  flagged: boolean;
  calendarName?: string;
  webLink?: string;
  eventKind?: 'family' | 'travel' | 'birthday' | 'personal';
}

// ─── AI PRIORITIZATION ENGINE ──────────────────────────────────────────────

export interface AIPriorityItem {
  id: string;
  title: string;
  source: TaskSource;
  sourceLabel: string;
  why: string;
  action: string;
  timeEstimate: string;
  scores: {
    urgency: number;
    strategic: number;
    revenue: number;
    relationship: number;
    deadlineRisk: number;
  };
  compositeScore: number;
  fireProbability: number;
  sentiment: 'critical' | 'negative' | 'neutral' | 'positive';
  flagged: boolean;
  completed: boolean;
}

// ─── RELATIONSHIP INTELLIGENCE ─────────────────────────────────────────────

export interface RelationshipContact {
  id: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  color: string;
  lastContact: string;
  daysSince: number;
  health: RelationshipHealth;
  healthScore: number;
  importance: 'critical' | 'high' | 'medium';
  tags: string[];
  aiInsight: string;
  suggestedMessage?: string;
  historicalNote?: string;
  dealsPending?: number;
  dealValue?: string;
}

// ─── PREDICTIVE RISK ───────────────────────────────────────────────────────

export interface RiskItem {
  id: string;
  title: string;
  category: 'relationship' | 'deadline' | 'revenue' | 'team' | 'operational' | 'health';
  probability: number;
  impact: 'critical' | 'high' | 'medium';
  description: string;
  recommendation: string;
  timeframe: string;
}

// ─── WHAT FELL THROUGH THE CRACKS ─────────────────────────────────────────

export interface CrackItem {
  id: string;
  title: string;
  category: 'email' | 'task' | 'person' | 'opportunity' | 'crm' | 'follow-up';
  daysSince: number;
  urgency: 'high' | 'medium' | 'low';
  aiNote: string;
  source: string;
}

// ─── ANXIETY REDUCERS ──────────────────────────────────────────────────────

export interface AnxietyReducer {
  id: string;
  label: string;
  status: 'clear' | 'warning' | 'issue';
  detail: string;
}

// ─── AI MORNING BRIEF ──────────────────────────────────────────────────────

export interface BriefSection {
  /** Short heading, e.g. "Needs you today" or "Deals". */
  heading: string;
  /** One line per item. Bare facts, no preamble. */
  points: string[];
}

export interface DailyBriefing {
  date: string;
  generatedAt: string;
  overdueTasks: OverdueTask[];
  keyInsights: string[];
  weatherCondition: string;
  temperature: string;
  conversationalBrief: string;
  /** Structured morning summary — rendered with headers. */
  briefSections?: BriefSection[];
}

export interface OverdueTask {
  title: string;
  source: TaskSource;
  daysOverdue: number;
  priority: Priority;
}

// ─── PERFORMANCE INSIGHTS ──────────────────────────────────────────────────

export interface PerformanceInsight {
  id: string;
  title: string;
  correlation: string;
  dataPoints: string;
  recommendation: string;
  trend: 'positive' | 'negative' | 'neutral';
}

// ══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

export const aiPriorityItems: AIPriorityItem[] = [
  {
    id: 'ai1',
    title: 'Series B term sheet — 2 legal clauses flagged, deadline 5 PM today',
    source: 'email',
    sourceLabel: 'Email from Advisor 1',
    why: 'Hard deadline today at 5 PM. Legal flagged two clauses that could affect founder control. Missing this has irreversible consequences.',
    action: 'Block 45 min now. Read both clauses, call Advisor 1, decide and sign.',
    timeEstimate: '45 min',
    scores: { urgency: 10, strategic: 10, revenue: 9, relationship: 8, deadlineRisk: 10 },
    compositeScore: 96,
    fireProbability: 94,
    sentiment: 'critical',
    flagged: true,
    completed: false,
  },
  {
    id: 'ai2',
    title: 'Company A ($280K) — Contact 4 waiting 2 days, decision window closing',
    source: 'email',
    sourceLabel: 'Email — Proposal follow-up',
    why: 'Engagement dropped after last email. Deals at this stage stall after 72 hrs of silence. 9 AM call is your window.',
    action: 'Call Contact 4 at 9 AM. Lead with ROI data from similar clients. Ask directly for the decision.',
    timeEstimate: '20 min',
    scores: { urgency: 9, strategic: 7, revenue: 10, relationship: 8, deadlineRisk: 9 },
    compositeScore: 90,
    fireProbability: 71,
    sentiment: 'negative',
    flagged: true,
    completed: false,
  },
  {
    id: 'ai3',
    title: 'Board call at 10:30 AM — deck not finalized, Investor 1 expects runway model',
    source: 'calendar',
    sourceLabel: 'Google Calendar',
    why: 'Investor 1 specifically asked for updated runway data on last call. Arriving unprepared damages credibility at a critical fundraising moment.',
    action: 'Pull updated 18-month runway model from Advisor 2. Add to slide 4 before 10:15 AM.',
    timeEstimate: '30 min',
    scores: { urgency: 9, strategic: 10, revenue: 8, relationship: 10, deadlineRisk: 8 },
    compositeScore: 91,
    fireProbability: 68,
    sentiment: 'critical',
    flagged: true,
    completed: false,
  },
  {
    id: 'ai4',
    title: 'Contact 3 (Investor Firm B) — LinkedIn message + 5 PM call — potential Series B co-lead',
    source: 'linkedin',
    sourceLabel: 'LinkedIn + Calendar',
    why: "Contact 3 just got promoted to GP and is actively looking for a flagship deal. Their fund's new $500M raise signals strong deployment pressure. This is a high-leverage conversation.",
    action: 'Read their LinkedIn message before 5 PM call. Gauge co-lead interest without revealing Venture Firm A terms.',
    timeEstimate: '10 min prep',
    scores: { urgency: 7, strategic: 9, revenue: 10, relationship: 9, deadlineRisk: 7 },
    compositeScore: 85,
    fireProbability: 22,
    sentiment: 'positive',
    flagged: false,
    completed: false,
  },
  {
    id: 'ai5',
    title: 'Production incident — payments API 3x latency since 3 AM, engineering on it',
    source: 'email',
    sourceLabel: 'Incident Alert from Team Member 3',
    why: 'Active customer-facing incident. If unresolved by business hours, enterprise clients will notice and escalate. Check status before board call.',
    action: 'Ask Team Member 3 for status at 9:30 AM. If not resolved, send pre-emptive note to affected clients.',
    timeEstimate: '5 min check',
    scores: { urgency: 8, strategic: 6, revenue: 8, relationship: 7, deadlineRisk: 8 },
    compositeScore: 78,
    fireProbability: 55,
    sentiment: 'negative',
    flagged: true,
    completed: false,
  },
];

export const relationshipContacts: RelationshipContact[] = [
  {
    id: 'r1',
    name: 'Investor 2',
    role: 'Managing Partner',
    company: 'Venture Firm D',
    initials: 'I2',
    color: '#9b59b6',
    lastContact: '47 days ago',
    daysSince: 47,
    health: 'cold',
    healthScore: 18,
    importance: 'critical',
    tags: ['Investor', 'Board candidate', 'Series B'],
    aiInsight: "You haven't spoken in 47 days. Historically, your deals with this contact move forward within 30 days of reconnecting. They were warm on the Series B discussion in March.",
    suggestedMessage: "Hi — it's been a while and I wanted to reconnect. We've had a strong quarter — revenue up 34% YoY and a term sheet on the table. Would love to catch up this week if you have 20 minutes.",
    historicalNote: 'Last meeting: March 9. Discussed Series B timing. They said "reach out when you have a term sheet."',
    dealsPending: 1,
    dealValue: '$2M+',
  },
  {
    id: 'r2',
    name: 'Contact 14',
    role: 'CTO',
    company: 'Enterprise Client 1',
    initials: 'C14',
    color: '#e05252',
    lastContact: '31 days ago',
    daysSince: 31,
    health: 'cooling',
    healthScore: 34,
    importance: 'critical',
    tags: ['Client', 'Renewal at risk', 'High value'],
    aiInsight: 'Renewal is in 60 days. Engagement has dropped — no response to last two check-ins. Sentiment on recent support tickets has turned negative. Churn risk elevated.',
    suggestedMessage: "Hi — I've been thinking about your team's roadmap and wanted to personally check in. Can we schedule 30 minutes this week? I have some ideas I think would be directly relevant to your Q3 goals.",
    historicalNote: '$380K ARR contract. Champion previously very engaged — pattern has shifted.',
    dealsPending: 1,
    dealValue: '$380K renewal',
  },
  {
    id: 'r3',
    name: 'Contact 15',
    role: 'CEO',
    company: 'Strategic Partner A',
    initials: 'C15',
    color: '#27ae60',
    lastContact: '22 days ago',
    daysSince: 22,
    health: 'cooling',
    healthScore: 45,
    importance: 'high',
    tags: ['Partner', 'BD', 'Co-marketing'],
    aiInsight: 'Co-marketing agreement expires in 45 days. No discussion about renewal yet. They are actively partnering with a competitor based on their recent LinkedIn activity.',
    suggestedMessage: "Hey — I saw the great momentum your team is building. As we head into Q3 I wanted to revisit our partnership and see if there's an opportunity to expand what we're doing together.",
    historicalNote: 'Partnership drove 12 leads last quarter. Strong mutual value.',
    dealsPending: 0,
  },
  {
    id: 'r4',
    name: 'Investor 1',
    role: 'Managing Partner',
    company: 'Venture Firm A',
    initials: 'I1',
    color: '#c9a044',
    lastContact: '6 days ago',
    daysSince: 6,
    health: 'strong',
    healthScore: 88,
    importance: 'critical',
    tags: ['Board', 'Lead investor', 'Active'],
    aiInsight: 'Relationship is strong and active. Meeting today at 10:30 AM. Last interaction was positive — they approved the hire plan. No concerns.',
    historicalNote: 'Lead Series A. Active board member. Very engaged.',
    dealsPending: 0,
  },
  {
    id: 'r5',
    name: 'Contact 16',
    role: 'VP of Procurement',
    company: 'Enterprise Prospect B',
    initials: 'C16',
    color: '#4a9ed6',
    lastContact: '14 days ago',
    daysSince: 14,
    health: 'good',
    healthScore: 62,
    importance: 'high',
    tags: ['Prospect', 'Enterprise', 'Q3 target'],
    aiInsight: "Warm prospect from SaaStr 2025. Initial demo was positive. They're evaluating 3 vendors — decision by July 15. You haven't followed up since the demo.",
    suggestedMessage: "I wanted to follow up after our demo last month. I've put together a tailored ROI analysis based on your team's specific use case — would love 30 minutes to walk you through it.",
    historicalNote: '$220K potential deal. Decision maker confirmed interest in April.',
    dealsPending: 1,
    dealValue: '$220K',
  },
  {
    id: 'r6',
    name: 'Contact 17',
    role: 'General Partner',
    company: 'Investor Firm E',
    initials: 'C17',
    color: '#4caf82',
    lastContact: '4 days ago',
    daysSince: 4,
    health: 'strong',
    healthScore: 82,
    importance: 'high',
    tags: ['Investor', 'Series B interest', 'Warm'],
    aiInsight: 'Recently engaged and positive. Expressed interest in participating in Series B in a side conversation at SaaStr. Relationship is warm and timely.',
    historicalNote: 'Met at SaaStr. Connected on LinkedIn. No formal meeting yet.',
    dealsPending: 0,
  },
];

export const riskItems: RiskItem[] = [
  {
    id: 'risk1',
    title: 'Enterprise Client 1 churn risk',
    category: 'revenue',
    probability: 68,
    impact: 'critical',
    description: 'Renewal in 60 days. Contact 14 has gone quiet — no response in 31 days, 3 negative support tickets this month, and engagement metrics have dropped 40%.',
    recommendation: 'Personal outreach from you today. Do not let another week pass. Offer EBR (Executive Business Review) before renewal discussion.',
    timeframe: 'Next 14 days',
  },
  {
    id: 'risk2',
    title: '3 pipeline deals showing stall pattern',
    category: 'revenue',
    probability: 61,
    impact: 'high',
    description: "Company A, Company C, and Prospect B all match the behavioral pattern of previously stalled deals: 72+ hours since last contact, no next step scheduled.",
    recommendation: 'Company A is most urgent — call at 9 AM today. Company C and Prospect B need follow-ups scheduled this week.',
    timeframe: 'This week',
  },
  {
    id: 'risk3',
    title: 'Board call under-prepared — runway model missing',
    category: 'relationship',
    probability: 75,
    impact: 'critical',
    description: 'Investor 1 specifically requested updated runway numbers on the last call. Current deck does not reflect last week\'s cash position update.',
    recommendation: 'Get updated numbers from Advisor 2 before 10:15 AM. 15 minutes of prep prevents credibility damage.',
    timeframe: 'Next 2 hours',
  },
  {
    id: 'risk4',
    title: 'Keynote slide deck — deadline tomorrow, not started',
    category: 'operational',
    probability: 82,
    impact: 'high',
    description: 'SaaStr keynote slide deck is due to AV team tomorrow. No draft exists yet. 30-minute slot requires substantial material.',
    recommendation: 'Block 2 hours tomorrow morning. Pull framework from last keynote, update data points, add new growth narrative.',
    timeframe: 'Tomorrow 9 AM deadline',
  },
  {
    id: 'risk5',
    title: 'Team Member 6 showing signs of burnout',
    category: 'team',
    probability: 55,
    impact: 'high',
    description: 'VP of Sales logged 68-hour weeks for 3 consecutive weeks. Pipeline is 18% behind Q3 target. No vacation taken in 4 months.',
    recommendation: 'Raise directly in 3:30 PM 1:1 today. Acknowledge the strain before discussing pipeline. Ask what support they need.',
    timeframe: "Today's 1:1",
  },
  {
    id: 'risk6',
    title: 'Travel fatigue risk — back-to-back travel + board week',
    category: 'health',
    probability: 70,
    impact: 'medium',
    description: 'SaaStr trip (May 28–30) leads directly into a packed week with investor meetings. Historical pattern: decision quality drops after 2+ consecutive travel days.',
    recommendation: 'Block no-meeting morning on June 2 for recovery. Pre-record any async updates that can wait.',
    timeframe: 'Next 7 days',
  },
];

export const crackItems: CrackItem[] = [
  {
    id: 'cr1',
    title: 'Investor 2 follow-up — promised at March board meeting',
    category: 'person',
    daysSince: 47,
    urgency: 'high',
    aiNote: 'You said "I\'ll reach out when we have a term sheet" — you now have one. This is the exact window they were waiting for.',
    source: 'Calendar note — Mar 9',
  },
  {
    id: 'cr2',
    title: 'Company D onboarding — NDA signed but no kickoff scheduled',
    category: 'crm',
    daysSince: 3,
    urgency: 'high',
    aiNote: 'CRM shows deal closed but no onboarding tasks created. Contact 9 has gone quiet. First impressions at onboarding set the tone for retention.',
    source: 'Email',
  },
  {
    id: 'cr3',
    title: 'Company E acquisition interest — Contact 10 called 3 days ago, no callback',
    category: 'opportunity',
    daysSince: 3,
    urgency: 'high',
    aiNote: 'A $2.4M potential deal. Contact 10 reached out proactively. Every day without a callback signals disinterest on your end.',
    source: 'Missed call',
  },
  {
    id: 'cr4',
    title: 'PR Agency follow-up — Forbes feature timeline promised last week',
    category: 'follow-up',
    daysSince: 6,
    urgency: 'medium',
    aiNote: 'Contact 7 sent a proposed timeline 6 days ago. No response from you. They may proceed without your input.',
    source: 'Email',
  },
  {
    id: 'cr5',
    title: 'VP of Marketing job description — approval requested by HR 5 days ago',
    category: 'task',
    daysSince: 5,
    urgency: 'medium',
    aiNote: 'Hiring timeline blocked on your sign-off. Every week of delay pushes hiring out by ~2 weeks due to scheduling.',
    source: 'Asana',
  },
];

export const anxietyReducers: AnxietyReducer[] = [
  { id: 'ax1', label: "Today's travel confirmed", status: 'clear', detail: 'No travel today. SaaStr trip confirmed Thu–Sat.' },
  { id: 'ax2', label: 'Investor meetings covered', status: 'clear', detail: '2 investor touchpoints scheduled today — 10:30 AM board call, 5 PM Fund B call.' },
  { id: 'ax3', label: 'High-priority follow-ups', status: 'issue', detail: '2 flagged follow-ups overdue: Investor 2 (47 days) and Company E callback (3 days).' },
  { id: 'ax4', label: 'Legal & compliance', status: 'warning', detail: 'Term sheet deadline today at 5 PM. Not yet signed.' },
  { id: 'ax5', label: 'Team conflicts or escalations', status: 'clear', detail: 'No urgent HR escalations. Team Member 6 showing fatigue — flagged for 1:1 today.' },
  { id: 'ax6', label: 'Inbox — investor emails', status: 'clear', detail: 'No unread investor emails older than 24 hours.' },
];

export const dailyBriefing: DailyBriefing = {
  date: 'Tuesday, May 26, 2026',
  generatedAt: '4:45 AM',
  weatherCondition: 'Partly Cloudy',
  temperature: '72°F',
  conversationalBrief: "Good morning, Kory. Today is a high-stakes day — you have a hard deadline, a board call, and a potential co-investor conversation all converging. Here's the honest picture: the term sheet needs your attention first, before anything else opens. Legal flagged two clauses overnight and the clock is running. After that, your 10:30 AM board call is only as strong as your runway model — get that number from Advisor 2 before you dial in. The good news: Q2 revenue came in strong at +34% YoY, and you're walking into that call from a position of momentum. The production incident from 3 AM appears to be on track for an 8 AM resolution — check in at 9:30 AM before it becomes a board topic. One thing that's been falling through the cracks: Investor 2. You have a term sheet now, which is exactly the trigger you told them to wait for. 47 days is too long — reach out today.",
  keyInsights: [
    'Term sheet deadline TODAY at 5 PM — 2 legal clauses flagged, review before anything else',
    'Q2 revenue +34% YoY confirmed — strong position heading into board call',
    'Production incident tracking toward 8 AM resolution — verify at 9:30 AM',
    'Company A ($280K) engagement dropped — 9 AM call is the closing window',
    "Investor 2 is waiting for exactly this moment — 47 days silent, you have a term sheet now",
    'Contact 3 promoted to GP 3 months ago — first major deal in new role could be yours today',
  ],
  overdueTasks: [
    { title: 'Series B pitch deck final review', source: 'asana', daysOverdue: 2, priority: 'critical' },
    { title: 'Company E executive alignment call', source: 'email', daysOverdue: 3, priority: 'medium' },
    { title: 'Board meeting materials finalization', source: 'asana', daysOverdue: 1, priority: 'high' },
    { title: 'Company D NDA follow-up', source: 'email', daysOverdue: 1, priority: 'high' },
  ],
};

export const performanceInsights: PerformanceInsight[] = [
  {
    id: 'pi1',
    title: 'Sleep → Decision Quality',
    correlation: 'Your highest-stakes decisions correlate strongly with 7+ hour sleep nights',
    dataPoints: '14-day analysis: Avg decision response time 2.3hrs on 7h+ sleep vs 5.1hrs on <6h sleep',
    recommendation: 'Today you had 6.5 hours. Board call and term sheet are high-cognition tasks — consider a 10-min walk before the 10:30 AM call.',
    trend: 'neutral',
  },
  {
    id: 'pi2',
    title: 'Morning Workouts → Focus Blocks',
    correlation: 'Days with a morning workout show 40% longer uninterrupted focus periods',
    dataPoints: 'Past 30 days: workout days average 2.8 hrs deep work vs 1.7 hrs on rest days',
    recommendation: 'No workout logged yet today. Even a 20-minute session before the day ramps up would improve afternoon focus.',
    trend: 'negative',
  },
  {
    id: 'pi3',
    title: 'Protein Intake → Energy Levels',
    correlation: 'Days hitting 150g+ protein correlate with lower 3 PM energy dips',
    dataPoints: 'You hit goal 9 of last 14 days. On goal days, you schedule 18% fewer "push to tomorrow" tasks',
    recommendation: "You're at 62g by mid-morning — add a protein-dense lunch to close the gap before the afternoon meeting block.",
    trend: 'negative',
  },
  {
    id: 'pi4',
    title: 'Travel → Decision Quality',
    correlation: 'Decision quality drops measurably after 2+ consecutive travel days',
    dataPoints: 'Post-travel weeks show 23% more tasks rescheduled and 31% longer email response times',
    recommendation: 'SaaStr trip (Thu–Sat) is 3 days. Block a recovery morning on June 2. Defer any major decisions to June 3+.',
    trend: 'neutral',
  },
];

// ─── EMAILS ────────────────────────────────────────────────────────────────

export const emails: Email[] = [
  {
    id: 'e1',
    sender: 'Advisor 1',
    senderInitials: 'A1',
    senderColor: '#4a9ed6',
    subject: 'Term Sheet — Revised v3 attached',
    preview: 'Hi Kory, please find the revised term sheet attached. Legal flagged two clauses on pages 4 and 7 that could affect founder control provisions...',
    time: '6:12 AM',
    unread: true,
    flagged: true,
    priority: 'critical',
    labels: ['Legal', 'Urgent'],
    aiCategory: 'legal',
    aiTriage: 'urgent-reply',
    aiSummary: 'Revised term sheet: legal flagged 2 clauses on founder control. Deadline 5 PM today. Needs your sign-off.',
    sentimentScore: -0.3,
    draftReply: "Thanks — reviewing now. I'll call you by 10 AM with questions on the two flagged clauses before I sign.",
  },
  {
    id: 'e2',
    sender: 'Board Member 1',
    senderInitials: 'B1',
    senderColor: '#9b59b6',
    subject: 'Board Meeting Agenda — Tuesday 10:30 AM',
    preview: "Kory — I've updated the agenda to include the Series B discussion and Q2 metrics. Investor 1 asked for the runway model specifically...",
    time: '5:58 AM',
    unread: true,
    flagged: false,
    priority: 'high',
    labels: ['Board', 'Meeting'],
    aiCategory: 'board',
    aiTriage: 'deep-response',
    aiSummary: 'Updated agenda: Series B + Q2 metrics. Runway model requested by Investor 1. Review before 10:30 AM.',
    sentimentScore: 0.1,
  },
  {
    id: 'e3',
    sender: 'Team Member 1',
    senderInitials: 'T1',
    senderColor: '#27ae60',
    subject: 'Pipeline Update: 3 new enterprise leads',
    preview: 'Good morning! We have 3 new inbound enterprise leads from last Thursday\'s webinar. Combined potential ~$400K...',
    time: '5:44 AM',
    unread: true,
    flagged: false,
    priority: 'medium',
    labels: ['Sales', 'Pipeline'],
    aiCategory: 'sales',
    aiTriage: 'fyi',
    aiSummary: '3 new enterprise leads from webinar, ~$400K combined potential. No action required — Team Member 1 is qualifying.',
    sentimentScore: 0.7,
    delegateTo: 'Team Member 6 (VP of Sales)',
  },
  {
    id: 'e4',
    sender: 'Team Member 2',
    senderInitials: 'T2',
    senderColor: '#e67e22',
    subject: 'Q2 Financial Report — Final',
    preview: 'Hi Kory, attached is the finalized Q2 report. Revenue is up 34% YoY with strong margins. Full breakdown inside...',
    time: '4:50 AM',
    unread: true,
    flagged: false,
    priority: 'high',
    labels: ['Finance', 'Q2'],
    aiCategory: 'finance',
    aiTriage: 'quick-reply',
    aiSummary: 'Final Q2 report: Revenue +34% YoY, strong margins. Key figures to reference in board call.',
    sentimentScore: 0.8,
    draftReply: 'Thank you — this is excellent. Pulling the headline numbers for the board call this morning.',
  },
  {
    id: 'e5',
    sender: 'Team Member 3',
    senderInitials: 'T3',
    senderColor: '#e05252',
    subject: 'URGENT: Production issue — API latency spike',
    preview: "We're seeing a 3x latency spike on the payments API since 3 AM. Engineering is on it. ETA 8 AM for resolution...",
    time: '4:22 AM',
    unread: true,
    flagged: true,
    priority: 'critical',
    labels: ['Engineering', 'Incident'],
    aiCategory: 'urgent',
    aiTriage: 'urgent-reply',
    aiSummary: 'Active incident: payments API 3x latency since 3 AM. Engineering targeting 8 AM fix. Ask for 9:30 AM status update.',
    sentimentScore: -0.8,
    draftReply: "Thanks for the heads-up. Keep me posted — I need a status update by 9:30 AM before the board call. If unresolved by 8:30 AM, let's talk briefly.",
  },
  {
    id: 'e6',
    sender: 'Contact 1',
    senderInitials: 'C1',
    senderColor: '#c9a044',
    subject: 'PR opportunities — Forbes & TechCrunch',
    preview: "I've confirmed interest from both Forbes and TechCrunch. Forbes wants a growth story feature, TechCrunch wants a founder interview...",
    time: '3:15 AM',
    unread: false,
    flagged: false,
    priority: 'medium',
    labels: ['PR', 'Media'],
    aiCategory: 'pr',
    aiTriage: 'delegate',
    aiSummary: 'Forbes feature + TechCrunch interview confirmed. Scheduling windows available. Can be delegated for now.',
    sentimentScore: 0.6,
    delegateTo: 'EA / Chief of Staff',
  },
  {
    id: 'e7',
    sender: 'Family Member',
    senderInitials: 'FM',
    senderColor: '#4caf82',
    subject: 'Dinner Sunday — are you free?',
    preview: "Hey! Checking if you're free Sunday evening. Mom wants to do a family dinner around 6 PM...",
    time: '11:30 PM',
    unread: false,
    flagged: false,
    priority: 'low',
    labels: ['Personal'],
    aiCategory: 'personal',
    aiTriage: 'quick-reply',
    aiSummary: 'Family dinner invite Sunday 6 PM. Reply when you have a moment — not urgent.',
    sentimentScore: 0.9,
    draftReply: "Yes! I'll be there. Looking forward to it.",
  },
];

// ─── MEETINGS ──────────────────────────────────────────────────────────────

export const meetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Board Call — Series B Update',
    time: '10:30 AM',
    duration: '60 min',
    location: 'Zoom',
    type: 'video',
    flagged: true,
    agenda: 'Q2 metrics review, Series B term sheet discussion, strategic roadmap alignment',
    notes: 'Prepare: Revenue growth chart, CAC/LTV slide, 18-month runway projection',
    aiTalkingPoints: [
      'Open with Q2 revenue highlight: +34% YoY — anchor the conversation on momentum',
      'Frame Series B as accelerating an already-working model, not a lifeline',
      'Anticipate question on CAC payback period — have 14-month figure ready',
      'Address the two legal term sheet clauses proactively before they ask',
    ],
    aiRelationshipContext: 'Investor 1 has been on the board 18 months. Last call ended with concern about burn rate — come with updated runway. Board Member 1 is supportive and will champion your position if you give them the data.',
    aiRecentNews: "Investor 1's firm announced a new $500M fund last week — strong signal they are actively deploying. No negative press on any attendees.",
    attendees: [
      { name: 'Investor 1', role: 'Managing Partner', company: 'Venture Firm A', initials: 'I1', color: '#9b59b6', bio: 'Led investments in 3 unicorns. 15 years VC. Focus on B2B SaaS. Values data-driven founders who know their numbers cold.' },
      { name: 'Board Member 1', role: 'Board Member', company: 'Iconic Founders Group', initials: 'B1', color: '#c9a044', bio: 'Co-founder and strategic advisor. Specializes in Series A/B transitions. Will support you if you bring the data.' },
      { name: 'Advisor 2', role: 'CFO', company: 'Iconic Founders Group', initials: 'A2', color: '#4a9ed6', bio: 'Former investment banking. Owns the financial model. Brief her before the call on the runway update.' },
    ],
  },
  {
    id: 'm2',
    title: 'Product Roadmap Review — Q3 Planning',
    time: '1:00 PM',
    duration: '45 min',
    location: 'Conference Room A',
    type: 'in-person',
    flagged: false,
    agenda: 'Review Q3 feature priorities, resource allocation, and launch timelines',
    aiTalkingPoints: [
      'Push back on Feature 3 timeline — engineering is under-resourced until new hire onboards',
      'Approve Feature 1 and Feature 2 for Q3 — already scoped and estimated',
      'Ask for mobile roadmap update — was delayed from Q2 with no explanation',
    ],
    aiRelationshipContext: 'Team Member 4 and Team Member 5 have worked well this quarter. Both are execution-focused — come with decisions, not open questions.',
    attendees: [
      { name: 'Team Member 4', role: 'VP of Product', company: 'Iconic Founders Group', initials: 'T4', color: '#27ae60', bio: 'Strong on roadmap execution. Joined 18 months ago. Prefers clear CEO direction over open debate.' },
      { name: 'Team Member 5', role: 'Head of Engineering', company: 'Iconic Founders Group', initials: 'T5', color: '#e67e22', bio: 'Pragmatic, direct. Will flag resource gaps early. Trust his capacity assessments.' },
    ],
  },
  {
    id: 'm3',
    title: '1:1 — VP of Sales Check-in',
    time: '3:30 PM',
    duration: '30 min',
    location: 'Google Meet',
    type: 'video',
    flagged: false,
    agenda: 'Pipeline review, team morale, hiring plan for Q3',
    aiTalkingPoints: [
      'Acknowledge the team\'s wins before pipeline gaps — morale is already strained',
      'Discuss pipeline: currently 18% behind Q3 target — ask what they need, not why it\'s behind',
      'AI Risk flag: Team Member 6 may be burning out — raise support before headcount asks',
    ],
    aiRelationshipContext: 'Team Member 6 is a high performer under strain. 68-hour weeks for 3 consecutive weeks. Acknowledge the workload openly — they will respond better to support than pressure.',
    attendees: [
      { name: 'Team Member 6', role: 'VP of Sales', company: 'Iconic Founders Group', initials: 'T6', color: '#27ae60', bio: '10+ years enterprise sales. High performer. Currently stretched thin — handle with care in today\'s 1:1.' },
    ],
  },
  {
    id: 'm4',
    title: 'Investor Update — Fund B',
    time: '5:00 PM',
    duration: '30 min',
    location: 'Zoom',
    type: 'video',
    flagged: true,
    agenda: 'Monthly KPI update, team expansion, next round timing',
    aiTalkingPoints: [
      'Lead with ARR milestone — crossed $2M last week',
      'Gauge their co-lead interest for Series B without disclosing Venture Firm A terms',
      "Contact 3 is newly promoted GP — their fund just raised $500M. They are looking for a flagship deal in their new role.",
    ],
    aiRelationshipContext: 'Contact 3 messaged on LinkedIn this morning likely about this call. They are in deployment mode after a new fund raise. This is a high-leverage conversation.',
    aiRecentNews: 'Investor Firm B closed new $500M fund 10 days ago. Contact 3 promoted to GP 3 months ago — no major deal in new role yet. Timing is ideal.',
    attendees: [
      { name: 'Contact 3', role: 'General Partner', company: 'Investor Firm B', initials: 'C3', color: '#e05252', bio: 'Newly promoted GP. Actively looking for a flagship deal in their new role. High motivation to close. Focus on enterprise and fintech.' },
    ],
  },
];

export const calls: Call[] = [
  { id: 'c1', contact: 'Contact 4', contactInitials: 'C4', contactColor: '#4a9ed6', company: 'Company A', role: 'CEO', type: 'follow-up', time: '9:00 AM', duration: '20 min', notes: 'Follow up on $280K enterprise proposal. Decision expected by EOW. Engagement dropped after last email — this call is critical.', flagged: true, completed: false },
  { id: 'c2', contact: 'Contact 5', contactInitials: 'C5', contactColor: '#9b59b6', company: 'Company B', role: 'VP of Operations', type: 'scheduled', time: '11:00 AM', duration: '15 min', notes: 'Intro call — referred by Team Member 6. Mid-market prospect, 500-seat potential deal.', flagged: false, completed: false },
  { id: 'c3', contact: 'Contact 6', contactInitials: 'C6', contactColor: '#27ae60', company: 'Fund C', role: 'Partner', type: 'incoming', time: 'Yesterday, 4:15 PM', duration: '8 min', notes: 'Missed call. Voicemail: "Interested in co-investing in your Series B. Please call back."', flagged: true, completed: false },
  { id: 'c4', contact: 'Contact 7', contactInitials: 'C7', contactColor: '#e67e22', company: 'PR Agency', role: 'Account Director', type: 'follow-up', time: '2:00 PM', duration: '20 min', notes: 'Discuss Forbes feature article and TechCrunch interview scheduling.', flagged: false, completed: false },
];

export const asanaTasks: AsanaTask[] = [
  { id: 'a1', title: 'Review and approve Q3 OKRs for all departments', project: 'Company Strategy', assignee: 'Kory', dueDate: 'Today', priority: 'critical', status: 'due-today', flagged: true, subtasks: 8, completedSubtasks: 5 },
  { id: 'a2', title: 'Sign off on VP of Marketing job description', project: 'Hiring', assignee: 'Kory', dueDate: 'Today', priority: 'high', status: 'due-today', flagged: false, subtasks: 3, completedSubtasks: 3 },
  { id: 'a3', title: 'Review Series B pitch deck — final version', project: 'Fundraising', assignee: 'Kory', dueDate: '2 days ago', priority: 'critical', status: 'overdue', flagged: true, subtasks: 5, completedSubtasks: 4 },
  { id: 'a4', title: 'Finalize board meeting materials', project: 'Board Operations', assignee: 'Kory', dueDate: 'Yesterday', priority: 'high', status: 'overdue', flagged: false, subtasks: 4, completedSubtasks: 2 },
  { id: 'a5', title: 'Approve Q2 marketing budget reallocation', project: 'Finance', assignee: 'Kory', dueDate: 'Tomorrow', priority: 'medium', status: 'upcoming', flagged: false, subtasks: 2, completedSubtasks: 0 },
  { id: 'a6', title: 'Review and finalize partnership agreement — Partner Co.', project: 'Business Development', assignee: 'Kory', dueDate: 'In 3 days', priority: 'medium', status: 'upcoming', flagged: false, subtasks: 3, completedSubtasks: 1 },
];

export const linkedInMessages: LinkedInMessage[] = [
  { id: 'l1', sender: 'Contact 3', senderInitials: 'C3', senderColor: '#e05252', role: 'General Partner', company: 'Investor Firm B', preview: "Hey Kory — excited for our call today at 5 PM. Quick note: I'd love to discuss the co-lead option before we connect with Venture Firm A. Have some thoughts.", time: '7:30 AM', unread: true, flagged: true, connectionDegree: 1 },
  { id: 'l2', sender: 'Contact 11', senderInitials: 'C11', senderColor: '#9b59b6', role: 'CEO', company: 'Company F', preview: 'Kory, I read your piece in Forbes. Incredible growth story. Would love to connect and share insights from our Series C experience...', time: '6:45 AM', unread: true, flagged: false, connectionDegree: 2 },
  { id: 'l3', sender: 'Contact 12', senderInitials: 'C12', senderColor: '#27ae60', role: 'Head of BD', company: 'Partner Co.', preview: 'Hi Kory! Following up from SaaStr. Would love to explore a potential integration partnership. We have 50K mutual customers...', time: 'Yesterday', unread: true, flagged: false, connectionDegree: 1 },
  { id: 'l4', sender: 'Contact 13', senderInitials: 'C13', senderColor: '#c9a044', role: 'Partner', company: 'Investor Firm C', preview: "Thanks for the intro call last week. Our investment committee meets Thursday. I'll have an answer by end of week...", time: 'Yesterday', unread: false, flagged: false, connectionDegree: 1 },
];

export const healthLogs: HealthLog[] = [
  { id: 'h-today', date: 'Today', protein: 62, proteinGoal: 180, calories: 1240, calorieGoal: 2800, water: 48, waterGoal: 128, sleep: 6.5, sleepGoal: 8, weight: 182, steps: 2340, stepsGoal: 10000, workout: undefined },
  { id: 'h-yesterday', date: 'Yesterday', protein: 192, proteinGoal: 180, calories: 2650, calorieGoal: 2800, water: 112, waterGoal: 128, sleep: 7.5, sleepGoal: 8, weight: 182, steps: 8720, stepsGoal: 10000, workout: { type: 'Strength Training', duration: 55, intensity: 'intense', exercises: ['Bench Press 3x8', 'Deadlift 4x5', 'Pull-ups 3x10', 'Shoulder Press 3x8'], notes: 'PR on deadlift — 315 lbs' } },
  { id: 'h-2days', date: 'Mon', protein: 165, proteinGoal: 180, calories: 2400, calorieGoal: 2800, water: 96, waterGoal: 128, sleep: 6, sleepGoal: 8, weight: 183, steps: 5200, stepsGoal: 10000, workout: { type: 'Running', duration: 35, intensity: 'moderate', exercises: ['5K run'], notes: '24:30 — personal best this month' } },
];

export const travelSegments: TravelSegment[] = [
  { id: 'tr1', type: 'flight', title: 'Flight — City A → City B (SaaStr Annual)', date: 'Thu, May 28', time: '7:45 AM', endTime: '11:20 AM', confirmationCode: 'ABCD12', status: 'confirmed', details: 'Flight AA 1234 · Seat 3A (First Class) · Terminal 4, Gate B22', location: 'Airport A → Airport B', provider: 'Airline A', notes: 'Check-in opens tomorrow. Lounge access included.', flagged: false },
  { id: 'tr2', type: 'car', title: 'Car Service — Airport → Hotel', date: 'Thu, May 28', time: '11:40 AM', confirmationCode: 'RIDE9901', status: 'confirmed', details: 'Black SUV · Driver: Driver 1 · +1 (555) 000-0001', location: 'Airport B → Hotel A', provider: 'Car Service Co.', notes: 'Driver will be at arrivals with nameplate.', flagged: false },
  { id: 'tr3', type: 'hotel', title: 'Hotel A — SaaStr Conference Stay', date: 'Thu, May 28 – Sat, May 30', time: '3:00 PM check-in', endTime: '11:00 AM check-out', confirmationCode: 'HTL4455', status: 'confirmed', details: 'King Suite, Floor 22 · Early check-in requested · Breakfast included', location: 'City B', provider: 'Hotel A', notes: 'Conference badge pickup at hotel lobby 12–6 PM Thursday.', flagged: false },
  { id: 'tr4', type: 'restaurant', title: 'Dinner — Investor Dinner (Fund B)', date: 'Thu, May 28', time: '7:00 PM', endTime: '9:00 PM', confirmationCode: 'RSV-2244', status: 'confirmed', details: 'Table for 4 · Private dining room · Business casual', location: 'Restaurant A, City B', provider: 'Restaurant A', notes: 'Contact 3 and two partners attending. Wine pre-ordered.', flagged: true },
  { id: 'tr5', type: 'other', title: 'Keynote Speaking Slot — SaaStr Main Stage', date: 'Fri, May 29', time: '10:00 AM', endTime: '10:30 AM', confirmationCode: 'SPKR-089', status: 'confirmed', details: '30-min keynote · "Scaling from $1M to $10M ARR" · Slide deck due May 27', location: 'SaaStr Main Stage, City B', provider: 'SaaStr Conference', notes: 'Slide deck deadline is TOMORROW. AV contact: +1 (555) 000-0002.', flagged: true },
  { id: 'tr6', type: 'flight', title: 'Return Flight — City B → City A', date: 'Sat, May 30', time: '4:15 PM', endTime: '7:50 PM', confirmationCode: 'ABCD99', status: 'confirmed', details: 'Flight AA 5678 · Seat 2C (First Class) · Terminal 3, Gate A11', location: 'Airport B → Airport A', provider: 'Airline A', notes: '', flagged: false },
];
