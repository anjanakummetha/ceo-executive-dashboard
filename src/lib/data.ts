export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskSource = 'asana' | 'hubspot' | 'email' | 'linkedin' | 'calendar' | 'personal';
export type FlagStatus = 'flagged' | 'unflagged' | 'completed';

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
    title: 'Prep talking points for 10:30 AM board call with Sequoia',
    priority: 'critical',
    source: 'calendar',
    dueTime: '10:30 AM',
    flagged: true,
    actionRequired: true,
  },
  {
    id: 'p3',
    title: 'HubSpot deal: Acme Corp proposal — awaiting your approval',
    priority: 'high',
    source: 'hubspot',
    dueTime: '2:00 PM',
    flagged: true,
    actionRequired: true,
  },
  {
    id: 'p4',
    title: 'Respond to LinkedIn message from Michael Torres (Andreessen)',
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
    sender: 'David Park',
    senderInitials: 'DP',
    senderColor: '#4a9ed6',
    subject: 'Term Sheet — Revised v3 attached',
    preview: 'Hi Kory, please find the revised term sheet attached. Legal has reviewed...',
    time: '6:12 AM',
    unread: true,
    flagged: true,
    priority: 'critical',
    labels: ['Legal', 'Urgent'],
  },
  {
    id: 'e2',
    sender: 'Sarah Chen',
    senderInitials: 'SC',
    senderColor: '#9b59b6',
    subject: 'Board Meeting Agenda — Tuesday 10:30 AM',
    preview: "Kory — I've updated the agenda to include the Series B discussion and Q2 metrics...",
    time: '5:58 AM',
    unread: true,
    flagged: false,
    priority: 'high',
    labels: ['Board', 'Meeting'],
  },
  {
    id: 'e3',
    sender: 'Marcus Webb',
    senderInitials: 'MW',
    senderColor: '#27ae60',
    subject: 'Pipeline Update: 3 new enterprise leads',
    preview: 'Good morning! We have 3 new inbound enterprise leads from the webinar last Thursday...',
    time: '5:44 AM',
    unread: true,
    flagged: false,
    priority: 'medium',
    labels: ['Sales', 'Pipeline'],
  },
  {
    id: 'e4',
    sender: 'Jennifer Liu',
    senderInitials: 'JL',
    senderColor: '#e67e22',
    subject: 'Q2 Financial Report — Final',
    preview: 'Hi Kory, attached is the finalized Q2 report. Revenue is up 34% YoY with strong...',
    time: '4:50 AM',
    unread: true,
    flagged: false,
    priority: 'high',
    labels: ['Finance', 'Q2'],
  },
  {
    id: 'e5',
    sender: 'Alex Rodriguez',
    senderInitials: 'AR',
    senderColor: '#e05252',
    subject: 'URGENT: Production issue — API latency spike',
    preview: "We're seeing a 3x latency spike on the payments API since 3 AM. Engineering is investigating...",
    time: '4:22 AM',
    unread: true,
    flagged: true,
    priority: 'critical',
    labels: ['Engineering', 'Incident'],
  },
  {
    id: 'e6',
    sender: 'Rachel Kim',
    senderInitials: 'RK',
    senderColor: '#c9a044',
    subject: 'PR opportunities — Forbes & TechCrunch',
    preview: "I've confirmed interest from two major outlets. Forbes wants a feature on your growth story...",
    time: '3:15 AM',
    unread: false,
    flagged: false,
    priority: 'medium',
    labels: ['PR', 'Media'],
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
    attendees: [
      {
        name: 'Sarah Chen',
        role: 'Managing Partner',
        company: 'Sequoia Capital',
        initials: 'SC',
        color: '#9b59b6',
        bio: 'Led investments in Stripe, Airbnb. 15 years VC experience. Focus on B2B SaaS.',
      },
      {
        name: 'James Thornton',
        role: 'Board Member',
        company: 'Iconic Founders',
        initials: 'JT',
        color: '#c9a044',
        bio: 'Co-founder. Strategic advisor specializing in Series A/B transitions.',
      },
      {
        name: 'Diana Mercer',
        role: 'CFO',
        company: 'Iconic Founders',
        initials: 'DM',
        color: '#4a9ed6',
        bio: 'Former Goldman Sachs. Oversees financial strategy and investor relations.',
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
    attendees: [
      {
        name: 'Tom Bradley',
        role: 'VP of Product',
        company: 'Iconic Founders',
        initials: 'TB',
        color: '#27ae60',
        bio: 'Former Product Lead at Salesforce. Joined 18 months ago to lead product strategy.',
      },
      {
        name: 'Nina Patel',
        role: 'Head of Engineering',
        company: 'Iconic Founders',
        initials: 'NP',
        color: '#e67e22',
        bio: 'MIT CS grad. Built engineering org from 4 to 28 engineers in 2 years.',
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
    attendees: [
      {
        name: 'Marcus Webb',
        role: 'VP of Sales',
        company: 'Iconic Founders',
        initials: 'MW',
        color: '#27ae60',
        bio: '10+ years enterprise sales leadership. Previously at HubSpot and Salesforce.',
      },
    ],
  },
  {
    id: 'm4',
    title: 'Investor Update — Andreessen Horowitz',
    time: '5:00 PM',
    duration: '30 min',
    location: 'Zoom',
    type: 'video',
    flagged: true,
    agenda: 'Monthly KPI update, team expansion update, next round timing',
    attendees: [
      {
        name: 'Michael Torres',
        role: 'General Partner',
        company: 'Andreessen Horowitz',
        initials: 'MT',
        color: '#e05252',
        bio: 'GP at a16z. Led investments in GitHub, Lyft, Coinbase. Focus on enterprise & crypto.',
      },
    ],
  },
];

export const calls: Call[] = [
  {
    id: 'c1',
    contact: 'Robert Chang',
    contactInitials: 'RC',
    contactColor: '#4a9ed6',
    company: 'Acme Corp',
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
    contact: 'Lisa Park',
    contactInitials: 'LP',
    contactColor: '#9b59b6',
    company: 'TechScale Inc.',
    role: 'VP of Operations',
    type: 'scheduled',
    time: '11:00 AM',
    duration: '15 min',
    notes: 'Intro call — referred by Marcus. Mid-market prospect, 500-seat potential deal.',
    flagged: false,
    completed: false,
  },
  {
    id: 'c3',
    contact: 'Bryan Foster',
    contactInitials: 'BF',
    contactColor: '#27ae60',
    company: 'GrowthPoint Capital',
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
    contact: 'Amanda Wilson',
    contactInitials: 'AW',
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
    title: 'Sign off on new VP of Marketing job description',
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
];

export const hubspotTasks: HubSpotTask[] = [
  {
    id: 'h1',
    title: 'Send executive proposal to Acme Corp',
    contact: 'Robert Chang',
    company: 'Acme Corp',
    type: 'proposal',
    dueDate: 'Today, 12:00 PM',
    priority: 'critical',
    dealValue: '$280,000',
    stage: 'Proposal Sent',
    flagged: true,
  },
  {
    id: 'h2',
    title: 'Schedule product demo — Horizon Technologies',
    contact: 'Stephanie Moore',
    company: 'Horizon Technologies',
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
    contact: 'Daniel Reyes',
    company: 'CloudNative Inc.',
    type: 'follow-up',
    dueDate: 'Yesterday',
    priority: 'high',
    dealValue: '$150,000',
    stage: 'Closed Won',
    flagged: false,
  },
  {
    id: 'h4',
    title: 'Executive alignment call — GlobalTech acquisition interest',
    contact: 'Patricia Nguyen',
    company: 'GlobalTech Corp',
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
    sender: 'Michael Torres',
    senderInitials: 'MT',
    senderColor: '#e05252',
    role: 'General Partner',
    company: 'Andreessen Horowitz',
    preview: 'Hey Kory — excited for our call today at 5 PM. Quick note: I\'d love to discuss the co-lead option before we connect with Sequoia...',
    time: '7:30 AM',
    unread: true,
    flagged: true,
    connectionDegree: 1,
  },
  {
    id: 'l2',
    sender: 'Christine Hall',
    senderInitials: 'CH',
    senderColor: '#9b59b6',
    role: 'CEO',
    company: 'ScaleUp Ventures',
    preview: 'Kory, I read your piece in Forbes. Incredible growth story. Would love to connect and share some insights from our Series C experience...',
    time: '6:45 AM',
    unread: true,
    flagged: false,
    connectionDegree: 2,
  },
  {
    id: 'l3',
    sender: 'Derek Huang',
    senderInitials: 'DH',
    senderColor: '#27ae60',
    role: 'Head of BD',
    company: 'Stripe',
    preview: 'Hi Kory! Following up from the SaaStr conference. Would love to explore a potential integration partnership...',
    time: 'Yesterday',
    unread: true,
    flagged: false,
    connectionDegree: 1,
  },
  {
    id: 'l4',
    sender: 'Priya Sharma',
    senderInitials: 'PS',
    senderColor: '#c9a044',
    role: 'Partner',
    company: 'Index Ventures',
    preview: 'Thanks for the intro call last week. Our investment committee meets Thursday. I\'ll have an answer for you by end of week...',
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
    'Series B term sheet deadline is TODAY at 5:00 PM — legal review pending',
    'Production API incident from overnight — engineering monitoring, ETA for resolution 8:00 AM',
    'Acme Corp proposal ($280K) decision expected this week — follow-up call at 9:00 AM',
    'Board call at 10:30 AM — Sequoia managing partner attending; prepare revenue metrics',
    'GrowthPoint Capital left voicemail about co-investment interest — callback needed',
  ],
  overdueTasks: [
    { title: 'Series B pitch deck final review', source: 'asana', daysOverdue: 2, priority: 'critical' },
    { title: 'GlobalTech executive alignment call', source: 'hubspot', daysOverdue: 3, priority: 'medium' },
    { title: 'Board meeting materials finalization', source: 'asana', daysOverdue: 1, priority: 'high' },
    { title: 'CloudNative Inc. NDA follow-up', source: 'hubspot', daysOverdue: 1, priority: 'high' },
  ],
};
