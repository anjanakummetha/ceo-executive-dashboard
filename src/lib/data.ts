export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskSource = 'asana' | 'hubspot' | 'email' | 'linkedin' | 'calendar' | 'personal';
export type FlagStatus = 'flagged' | 'unflagged' | 'completed';
export type EmailCategory = 'urgent' | 'board' | 'team' | 'personal' | 'finance' | 'pr' | 'legal' | 'sales';

export interface TopPriority {
  id: string;
  title: string;
  priority: Priority;
  source: TaskSource;
  dueTime?: string;
  flagged: boolean;
  actionRequired: boolean;
}

export interface Email {
  id: string;
  sender: string;
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
  aiSummary?: string;
}

export interface Meeting {
  id: string;
  title: string;
  time: string;
  duration: string;
  attendees: Attendee[];
  location: string;
  type: 'video' | 'in-person' | 'phone';
  notes?: string;
  agenda?: string;
  flagged: boolean;
  aiTalkingPoints?: string[];
  aiRelationshipContext?: string;
  aiRecentNews?: string;
}

export interface Attendee {
  name: string;
  role: string;
  company: string;
  initials: string;
  color: string;
  bio?: string;
}

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

export interface AsanaTask {
  id: string;
  title: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: Priority;
  status: 'overdue' | 'due-today' | 'in-progress' | 'upcoming';
  flagged: boolean;
  subtasks?: number;
  completedSubtasks?: number;
}

export interface HubSpotTask {
  id: string;
  title: string;
  contact: string;
  company: string;
  type: 'follow-up' | 'call' | 'email' | 'demo' | 'proposal';
  dueDate: string;
  priority: Priority;
  dealValue?: string;
  stage?: string;
  flagged: boolean;
}

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

export interface WorkoutLog {
  type: string;
  duration: number;
  intensity: 'light' | 'moderate' | 'intense';
  exercises?: string[];
  notes?: string;
}

export interface DailyBriefing {
  date: string;
  generatedAt: string;
  overdueTasks: OverdueTask[];
  keyInsights: string[];
  weatherCondition: string;
  temperature: string;
}

export interface OverdueTask {
  title: string;
  source: TaskSource;
  daysOverdue: number;
  priority: Priority;
}

export interface TravelSegment {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'train' | 'restaurant' | 'other';
  title: string;
  date: string;
  time: string;
  endTime?: string;
  confirmationCode: string;
  status: 'confirmed' | 'pending' | 'checked-in' | 'completed';
  details: string;
  location?: string;
  provider?: string;
  notes?: string;
  flagged: boolean;
}

// ─── MOCK DATA ─────────────────────────────────────────────────────────────

export const topPriorities: TopPriority[] = [
  {
    id: 'p1',
    title: 'Review & sign Series B term sheet — deadline 5:00 PM today',
    priority: 'critical',
    source: 'email',
    dueTime: '5:00 PM',
    flagged: true,
    actionRequired: true,
  },
  {
    id: 'p2',
    title: 'Prep talking points for 10:30 AM board call with Investor 1',
    priority: 'critical',
    source: 'calendar',
    dueTime: '10:30 AM',
    flagged: true,
    actionRequired: true,
  },
  {
    id: 'p3',
    title: 'HubSpot deal: Company A proposal — awaiting your approval',
    priority: 'high',
    source: 'hubspot',
    dueTime: '2:00 PM',
    flagged: true,
    actionRequired: true,
  },
  {
    id: 'p4',
    title: 'Respond to LinkedIn message from Contact 3 (Investor firm)',
    priority: 'high',
    source: 'linkedin',
    flagged: false,
    actionRequired: true,
  },
  {
    id: 'p5',
    title: 'Quarterly OKR review deck — due to leadership team by EOD',
    priority: 'high',
    source: 'asana',
    dueTime: 'EOD',
    flagged: false,
    actionRequired: false,
  },
];

export const emails: Email[] = [
  {
    id: 'e1',
    sender: 'Advisor 1',
    senderInitials: 'A1',
    senderColor: '#4a9ed6',
    subject: 'Term Sheet — Revised v3 attached',
    preview: 'Hi Kory, please find the revised term sheet attached. Legal has reviewed and flagged two clauses...',
    time: '6:12 AM',
    unread: true,
    flagged: true,
    priority: 'critical',
    labels: ['Legal', 'Urgent'],
    aiCategory: 'legal',
    aiSummary: 'Revised term sheet for review. Legal flagged 2 clauses requiring your attention before 5 PM deadline.',
  },
  {
    id: 'e2',
    sender: 'Board Member 1',
    senderInitials: 'B1',
    senderColor: '#9b59b6',
    subject: 'Board Meeting Agenda — Tuesday 10:30 AM',
    preview: "Kory — I've updated the agenda to include the Series B discussion and Q2 metrics review...",
    time: '5:58 AM',
    unread: true,
    flagged: false,
    priority: 'high',
    labels: ['Board', 'Meeting'],
    aiCategory: 'board',
    aiSummary: 'Updated board agenda: Series B discussion + Q2 metrics added. Review before 10:30 AM call.',
  },
  {
    id: 'e3',
    sender: 'Team Member 1',
    senderInitials: 'T1',
    senderColor: '#27ae60',
    subject: 'Pipeline Update: 3 new enterprise leads',
    preview: 'Good morning! We have 3 new inbound enterprise leads from the webinar last Thursday...',
    time: '5:44 AM',
    unread: true,
    flagged: false,
    priority: 'medium',
    labels: ['Sales', 'Pipeline'],
    aiCategory: 'sales',
    aiSummary: '3 new enterprise leads from Thursday webinar. Combined potential deal value ~$400K.',
  },
  {
    id: 'e4',
    sender: 'Team Member 2',
    senderInitials: 'T2',
    senderColor: '#e67e22',
    subject: 'Q2 Financial Report — Final',
    preview: 'Hi Kory, attached is the finalized Q2 report. Revenue is up 34% YoY with strong margins...',
    time: '4:50 AM',
    unread: true,
    flagged: false,
    priority: 'high',
    labels: ['Finance', 'Q2'],
    aiCategory: 'finance',
    aiSummary: 'Q2 final report: Revenue +34% YoY. Margins strong. Full breakdown attached.',
  },
  {
    id: 'e5',
    sender: 'Team Member 3',
    senderInitials: 'T3',
    senderColor: '#e05252',
    subject: 'URGENT: Production issue — API latency spike',
    preview: "We're seeing a 3x latency spike on the payments API since 3 AM. Engineering is investigating...",
    time: '4:22 AM',
    unread: true,
    flagged: true,
    priority: 'critical',
    labels: ['Engineering', 'Incident'],
    aiCategory: 'urgent',
    aiSummary: 'Active production incident: 3x payments API latency since 3 AM. Engineering on it, ETA 8 AM resolution.',
  },
  {
    id: 'e6',
    sender: 'Contact 1',
    senderInitials: 'C1',
    senderColor: '#c9a044',
    subject: 'PR opportunities — Forbes & TechCrunch',
    preview: "I've confirmed interest from two major outlets. Forbes wants a feature on your growth story...",
    time: '3:15 AM',
    unread: false,
    flagged: false,
    priority: 'medium',
    labels: ['PR', 'Media'],
    aiCategory: 'pr',
    aiSummary: 'Forbes feature + TechCrunch interview confirmed. Scheduling windows available this week.',
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
    aiSummary: 'Family dinner invite for Sunday 6 PM. Reply needed.',
  },
];

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
    aiRelationshipContext: 'Investor 1 has been on the board for 18 months. Last call ended with concern about burn rate — come with an updated runway model. Board Member 2 is supportive and likely to champion your position.',
    aiRecentNews: 'Investor 1\'s firm announced a new $500M fund last week — strong signal they are actively deploying capital. No negative press on any attendees.',
    attendees: [
      {
        name: 'Investor 1',
        role: 'Managing Partner',
        company: 'Venture Firm A',
        initials: 'I1',
        color: '#9b59b6',
        bio: 'Led investments in 3 unicorns. 15 years VC experience. Focus on B2B SaaS. Values data-driven founders.',
      },
      {
        name: 'Board Member 1',
        role: 'Board Member',
        company: 'Iconic Founders Group',
        initials: 'B1',
        color: '#c9a044',
        bio: 'Co-founder and strategic advisor. Specializes in Series A/B transitions and scaling GTM.',
      },
      {
        name: 'Advisor 2',
        role: 'CFO',
        company: 'Iconic Founders Group',
        initials: 'A2',
        color: '#4a9ed6',
        bio: 'Former investment banking. Oversees financial strategy and investor relations. Key ally in this meeting.',
      },
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
      'Push back on timeline for Feature 3 — engineering is under-resourced until new hire onboards',
      'Approve Feature 1 and Feature 2 for Q3 launch — already scoped',
      'Ask about mobile roadmap status — was delayed from Q2',
    ],
    aiRelationshipContext: 'Team Member 4 and Team Member 5 have worked well together this quarter. No known conflicts. Both are execution-focused — come with decisions, not questions.',
    attendees: [
      {
        name: 'Team Member 4',
        role: 'VP of Product',
        company: 'Iconic Founders Group',
        initials: 'T4',
        color: '#27ae60',
        bio: 'Former product lead at a major SaaS company. Joined 18 months ago. Strong on roadmap execution.',
      },
      {
        name: 'Team Member 5',
        role: 'Head of Engineering',
        company: 'Iconic Founders Group',
        initials: 'T5',
        color: '#e67e22',
        bio: 'Built engineering org from 4 to 28 engineers. Pragmatic, direct. Flags resource gaps early.',
      },
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
      'Review the 3 new enterprise leads from this morning\'s email — qualify together',
      'Discuss pipeline gap to Q3 target — currently 18% behind',
      'Confirm Q3 headcount: 2 AEs approved, ask about SDR need',
    ],
    aiRelationshipContext: 'Team Member 6 is a high performer but has mentioned feeling stretched. Acknowledge the pipeline wins before diving into gaps.',
    attendees: [
      {
        name: 'Team Member 6',
        role: 'VP of Sales',
        company: 'Iconic Founders Group',
        initials: 'T6',
        color: '#27ae60',
        bio: '10+ years enterprise sales leadership. Strong closer. Currently managing a team of 8.',
      },
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
    agenda: 'Monthly KPI update, team expansion update, next round timing',
    aiTalkingPoints: [
      'Lead with ARR milestone — crossed $2M last week',
      'Mention the term sheet as validation without disclosing Venture Firm A details yet',
      'Gauge their interest in participating in Series B before you formally open the round',
    ],
    aiRelationshipContext: 'Contact 3 left a LinkedIn message this morning — likely related to this call. They announced a new fund last week, suggesting active deployment. Strong potential co-lead candidate.',
    aiRecentNews: 'Investor firm B announced a new $500M fund last week. Contact 3 promoted to General Partner 3 months ago — first major deal in new role could be yours.',
    attendees: [
      {
        name: 'Contact 3',
        role: 'General Partner',
        company: 'Investor Firm B',
        initials: 'C3',
        color: '#e05252',
        bio: 'Recently promoted GP. Focus on enterprise and fintech. First deal in new role — highly motivated to close.',
      },
    ],
  },
];

export const calls: Call[] = [
  {
    id: 'c1',
    contact: 'Contact 4',
    contactInitials: 'C4',
    contactColor: '#4a9ed6',
    company: 'Company A',
    role: 'CEO',
    type: 'follow-up',
    time: '9:00 AM',
    duration: '20 min',
    notes: 'Follow up on $280K enterprise proposal. Decision expected by EOW.',
    flagged: true,
    completed: false,
  },
  {
    id: 'c2',
    contact: 'Contact 5',
    contactInitials: 'C5',
    contactColor: '#9b59b6',
    company: 'Company B',
    role: 'VP of Operations',
    type: 'scheduled',
    time: '11:00 AM',
    duration: '15 min',
    notes: 'Intro call — referred by Team Member 6. Mid-market prospect, 500-seat potential deal.',
    flagged: false,
    completed: false,
  },
  {
    id: 'c3',
    contact: 'Contact 6',
    contactInitials: 'C6',
    contactColor: '#27ae60',
    company: 'Fund C',
    role: 'Partner',
    type: 'incoming',
    time: 'Yesterday, 4:15 PM',
    duration: '8 min',
    notes: 'Missed call. Voicemail: "Interested in co-investing in your Series B. Please call back."',
    flagged: true,
    completed: false,
  },
  {
    id: 'c4',
    contact: 'Contact 7',
    contactInitials: 'C7',
    contactColor: '#e67e22',
    company: 'PR Agency',
    role: 'Account Director',
    type: 'follow-up',
    time: '2:00 PM',
    duration: '20 min',
    notes: 'Discuss Forbes feature article and TechCrunch interview scheduling.',
    flagged: false,
    completed: false,
  },
];

export const asanaTasks: AsanaTask[] = [
  {
    id: 'a1',
    title: 'Review and approve Q3 OKRs for all departments',
    project: 'Company Strategy',
    assignee: 'Kory',
    dueDate: 'Today',
    priority: 'critical',
    status: 'due-today',
    flagged: true,
    subtasks: 8,
    completedSubtasks: 5,
  },
  {
    id: 'a2',
    title: 'Sign off on VP of Marketing job description',
    project: 'Hiring',
    assignee: 'Kory',
    dueDate: 'Today',
    priority: 'high',
    status: 'due-today',
    flagged: false,
    subtasks: 3,
    completedSubtasks: 3,
  },
  {
    id: 'a3',
    title: 'Review Series B pitch deck — final version',
    project: 'Fundraising',
    assignee: 'Kory',
    dueDate: '2 days ago',
    priority: 'critical',
    status: 'overdue',
    flagged: true,
    subtasks: 5,
    completedSubtasks: 4,
  },
  {
    id: 'a4',
    title: 'Finalize board meeting materials',
    project: 'Board Operations',
    assignee: 'Kory',
    dueDate: 'Yesterday',
    priority: 'high',
    status: 'overdue',
    flagged: false,
    subtasks: 4,
    completedSubtasks: 2,
  },
  {
    id: 'a5',
    title: 'Approve Q2 marketing budget reallocation',
    project: 'Finance',
    assignee: 'Kory',
    dueDate: 'Tomorrow',
    priority: 'medium',
    status: 'upcoming',
    flagged: false,
    subtasks: 2,
    completedSubtasks: 0,
  },
  {
    id: 'a6',
    title: 'Review and finalize partnership agreement — Partner Co.',
    project: 'Business Development',
    assignee: 'Kory',
    dueDate: 'In 3 days',
    priority: 'medium',
    status: 'upcoming',
    flagged: false,
    subtasks: 3,
    completedSubtasks: 1,
  },
];

export const hubspotTasks: HubSpotTask[] = [
  {
    id: 'h1',
    title: 'Send executive proposal to Company A',
    contact: 'Contact 4',
    company: 'Company A',
    type: 'proposal',
    dueDate: 'Today, 12:00 PM',
    priority: 'critical',
    dealValue: '$280,000',
    stage: 'Proposal Sent',
    flagged: true,
  },
  {
    id: 'h2',
    title: 'Schedule product demo — Company C',
    contact: 'Contact 8',
    company: 'Company C',
    type: 'demo',
    dueDate: 'Today',
    priority: 'high',
    dealValue: '$95,000',
    stage: 'Demo Scheduled',
    flagged: false,
  },
  {
    id: 'h3',
    title: 'Follow up: NDA signed — initiate onboarding',
    contact: 'Contact 9',
    company: 'Company D',
    type: 'follow-up',
    dueDate: 'Yesterday',
    priority: 'high',
    dealValue: '$150,000',
    stage: 'Closed Won',
    flagged: false,
  },
  {
    id: 'h4',
    title: 'Executive alignment call — Company E acquisition interest',
    contact: 'Contact 10',
    company: 'Company E',
    type: 'call',
    dueDate: '3 days ago',
    priority: 'medium',
    dealValue: '$2.4M',
    stage: 'Discovery',
    flagged: true,
  },
];

export const linkedInMessages: LinkedInMessage[] = [
  {
    id: 'l1',
    sender: 'Contact 3',
    senderInitials: 'C3',
    senderColor: '#e05252',
    role: 'General Partner',
    company: 'Investor Firm B',
    preview: "Hey Kory — excited for our call today at 5 PM. Quick note: I'd love to discuss the co-lead option before we connect with Venture Firm A...",
    time: '7:30 AM',
    unread: true,
    flagged: true,
    connectionDegree: 1,
  },
  {
    id: 'l2',
    sender: 'Contact 11',
    senderInitials: 'C11',
    senderColor: '#9b59b6',
    role: 'CEO',
    company: 'Company F',
    preview: 'Kory, I read your piece in Forbes. Incredible growth story. Would love to connect and share some insights from our Series C experience...',
    time: '6:45 AM',
    unread: true,
    flagged: false,
    connectionDegree: 2,
  },
  {
    id: 'l3',
    sender: 'Contact 12',
    senderInitials: 'C12',
    senderColor: '#27ae60',
    role: 'Head of BD',
    company: 'Partner Co.',
    preview: 'Hi Kory! Following up from the SaaStr conference. Would love to explore a potential integration partnership...',
    time: 'Yesterday',
    unread: true,
    flagged: false,
    connectionDegree: 1,
  },
  {
    id: 'l4',
    sender: 'Contact 13',
    senderInitials: 'C13',
    senderColor: '#c9a044',
    role: 'Partner',
    company: 'Investor Firm C',
    preview: "Thanks for the intro call last week. Our investment committee meets Thursday. I'll have an answer for you by end of week...",
    time: 'Yesterday',
    unread: false,
    flagged: false,
    connectionDegree: 1,
  },
];

export const healthLogs: HealthLog[] = [
  {
    id: 'h-today',
    date: 'Today',
    protein: 62,
    proteinGoal: 180,
    calories: 1240,
    calorieGoal: 2800,
    water: 48,
    waterGoal: 128,
    sleep: 6.5,
    sleepGoal: 8,
    weight: 182,
    steps: 2340,
    stepsGoal: 10000,
    workout: undefined,
  },
  {
    id: 'h-yesterday',
    date: 'Yesterday',
    protein: 192,
    proteinGoal: 180,
    calories: 2650,
    calorieGoal: 2800,
    water: 112,
    waterGoal: 128,
    sleep: 7.5,
    sleepGoal: 8,
    weight: 182,
    steps: 8720,
    stepsGoal: 10000,
    workout: {
      type: 'Strength Training',
      duration: 55,
      intensity: 'intense',
      exercises: ['Bench Press 3x8', 'Deadlift 4x5', 'Pull-ups 3x10', 'Shoulder Press 3x8'],
      notes: 'PR on deadlift — 315 lbs',
    },
  },
  {
    id: 'h-2days',
    date: 'Mon',
    protein: 165,
    proteinGoal: 180,
    calories: 2400,
    calorieGoal: 2800,
    water: 96,
    waterGoal: 128,
    sleep: 6,
    sleepGoal: 8,
    weight: 183,
    steps: 5200,
    stepsGoal: 10000,
    workout: {
      type: 'Running',
      duration: 35,
      intensity: 'moderate',
      exercises: ['5K run'],
      notes: '24:30 — personal best this month',
    },
  },
];

export const dailyBriefing: DailyBriefing = {
  date: 'Tuesday, May 26, 2026',
  generatedAt: '4:45 AM',
  weatherCondition: 'Partly Cloudy',
  temperature: '72°F',
  keyInsights: [
    'Series B term sheet deadline is TODAY at 5:00 PM — legal review pending on 2 clauses',
    'Active production incident: payments API 3x latency since 3 AM — engineering targeting 8 AM resolution',
    'Company A proposal ($280K) decision expected this week — follow-up call at 9:00 AM',
    'Board call at 10:30 AM — Investor 1 attending; prepare revenue metrics and updated runway model',
    'Fund C (Contact 6) left voicemail about Series B co-investment — callback needed today',
    'Q2 revenue +34% YoY confirmed in final report — lead with this in board call',
  ],
  overdueTasks: [
    { title: 'Series B pitch deck final review', source: 'asana', daysOverdue: 2, priority: 'critical' },
    { title: 'Company E executive alignment call', source: 'hubspot', daysOverdue: 3, priority: 'medium' },
    { title: 'Board meeting materials finalization', source: 'asana', daysOverdue: 1, priority: 'high' },
    { title: 'Company D NDA follow-up', source: 'hubspot', daysOverdue: 1, priority: 'high' },
  ],
};

export const travelSegments: TravelSegment[] = [
  {
    id: 'tr1',
    type: 'flight',
    title: 'Flight — City A → City B (SaaStr Annual)',
    date: 'Thu, May 28',
    time: '7:45 AM',
    endTime: '11:20 AM',
    confirmationCode: 'ABCD12',
    status: 'confirmed',
    details: 'Flight AA 1234 · Seat 3A (First Class) · Terminal 4, Gate B22',
    location: 'Airport A → Airport B',
    provider: 'Airline A',
    notes: 'Check-in opens tomorrow. Lounge access included.',
    flagged: false,
  },
  {
    id: 'tr2',
    type: 'car',
    title: 'Car Service — Airport → Hotel',
    date: 'Thu, May 28',
    time: '11:40 AM',
    confirmationCode: 'RIDE9901',
    status: 'confirmed',
    details: 'Black SUV · Driver: Driver 1 · +1 (555) 000-0001',
    location: 'Airport B → Hotel A',
    provider: 'Car Service Co.',
    notes: 'Driver will be at arrivals with nameplate.',
    flagged: false,
  },
  {
    id: 'tr3',
    type: 'hotel',
    title: 'Hotel A — SaaStr Conference Stay',
    date: 'Thu, May 28 – Sat, May 30',
    time: '3:00 PM check-in',
    endTime: '11:00 AM check-out',
    confirmationCode: 'HTL4455',
    status: 'confirmed',
    details: 'King Suite, Floor 22 · Early check-in requested · Breakfast included',
    location: 'City B',
    provider: 'Hotel A',
    notes: 'Conference badge pickup at hotel lobby 12–6 PM Thursday.',
    flagged: false,
  },
  {
    id: 'tr4',
    type: 'restaurant',
    title: 'Dinner — Investor Dinner (Fund B)',
    date: 'Thu, May 28',
    time: '7:00 PM',
    endTime: '9:00 PM',
    confirmationCode: 'RSV-2244',
    status: 'confirmed',
    details: 'Table for 4 · Private dining room booked · Dress code: Business casual',
    location: 'Restaurant A, City B',
    provider: 'Restaurant A',
    notes: 'Contact 3 and two partners attending. Pre-ordered wine selection.',
    flagged: true,
  },
  {
    id: 'tr5',
    type: 'other',
    title: 'Keynote Speaking Slot — SaaStr Main Stage',
    date: 'Fri, May 29',
    time: '10:00 AM',
    endTime: '10:30 AM',
    confirmationCode: 'SPKR-089',
    status: 'confirmed',
    details: '30-min keynote · Topic: "Scaling from $1M to $10M ARR" · Slide deck due May 27',
    location: 'SaaStr Main Stage, City B',
    provider: 'SaaStr Conference',
    notes: 'Slide deck deadline is TOMORROW. AV team contact: AV Contact +1 (555) 000-0002.',
    flagged: true,
  },
  {
    id: 'tr6',
    type: 'flight',
    title: 'Return Flight — City B → City A',
    date: 'Sat, May 30',
    time: '4:15 PM',
    endTime: '7:50 PM',
    confirmationCode: 'ABCD99',
    status: 'confirmed',
    details: 'Flight AA 5678 · Seat 2C (First Class) · Terminal 3, Gate A11',
    location: 'Airport B → Airport A',
    provider: 'Airline A',
    notes: '',
    flagged: false,
  },
];
