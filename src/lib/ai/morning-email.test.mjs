// The 4:45 email has to stand on its own — Kory should not need the dashboard
// to know who introduced someone or what to aim for. These pin the fields that
// travel with it, and the placeholders that must not.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { composeMorningEmailHtml, composeMorningEmailText } from './generate.ts';

const guest = (over = {}) => ({
  name: 'Nick Allen',
  email: 'nick@outside.com',
  emailContext: { email: '', companyGuess: '', messageCount: 0, snippets: [] },
  meetingTitle: 'Check-in',
  meetingTime: '4:00 PM MT',
  introducedBy: 'Cody',
  actionNeeded: true,
  actionNote: 'Nick asked how much ongoing involvement Kory wants — still unanswered.',
  angle: 'Lock down scope and cadence rather than let it stay informal.',
  bio: 'Limited public information available.',
  relationshipContext: '',
  conversationTip: '',
  confidence: 'low',
  ...over,
});

const compose = (people, extra = {}) =>
  composeMorningEmailText({
    dateLabel: 'Tue, Aug 4',
    insights: [],
    sections: [],
    schedule: [],
    dueToday: [],
    overdue: [],
    inbox: [],
    linkedInUnread: 0,
    people,
    ...extra,
  });

test('a guest brings their introducer, what is outstanding, and the angle', () => {
  const text = compose([guest()]);
  assert.match(text, /Introduced by Cody/);
  assert.match(text, /still unanswered/);
  assert.match(text, /Lock down scope/);
});

test('placeholder introducers and bios never reach the email', () => {
  // "Unknown" and "Limited public information available" are honest on the
  // dashboard and pure noise in a 4:45 AM email.
  const text = compose([
    guest({ introducedBy: 'Unknown', actionNeeded: false, actionNote: '', angle: '' }),
  ]);
  assert.doesNotMatch(text, /Unknown/i);
  assert.doesNotMatch(text, /Limited public information/i);
  assert.match(text, /Nick Allen/);
});

test('a real bio is used only when there is nothing more useful to say', () => {
  const text = compose([
    guest({
      introducedBy: '',
      actionNeeded: false,
      actionNote: '',
      angle: '',
      bio: 'Partner at Agility Equity Partners.',
    }),
  ]);
  assert.match(text, /Partner at Agility Equity Partners/);
});

test('colleagues are not listed as guests', () => {
  const text = compose([
    guest({ name: 'Heidi Heckler', email: 'heidi.heckler@iconicfounders.com' }),
    guest({ name: 'Sujash Barman', email: 'sjbarman@ucdavis.edu' }),
  ]);
  assert.doesNotMatch(text, /Heidi Heckler/);
  assert.doesNotMatch(text, /Sujash Barman/, 'colleague on a personal address is still internal');
});

test('every first-time guest keeps full detail; recurring guests compact', () => {
  const many = ['A One', 'B Two', 'C Three', 'D Four'].map((name) =>
    guest({ name, email: `${name.split(' ')[0].toLowerCase()}@outside.com` }),
  );
  const familiar = ['E Five', 'F Six'].map((name) =>
    guest({
      name,
      email: `${name.split(' ')[0].toLowerCase()}@outside.com`,
      recurring: true,
      actionNeeded: false,
      actionNote: '',
    }),
  );
  const text = compose([...many, ...familiar]);
  // All four first-timers get the full prebrief — that is what it is for.
  assert.equal((text.match(/Introduced by Cody/g) ?? []).length, 4);
  // The recurring guests compact to a name-and-time line.
  assert.match(text, /Also meeting: E Five .*, F Six/);
  assert.match(text, /full briefs on the dashboard/);
});

test('a recurring guest with something awaiting Kory keeps full detail', () => {
  const text = compose([
    guest({ recurring: true, actionNeeded: true, actionNote: 'Waiting on the LOI redline.' }),
  ]);
  assert.match(text, /Waiting on the LOI redline/);
  assert.doesNotMatch(text, /Also meeting/);
});

test('when research fails the roster still travels, with an honest note', () => {
  const text = compose(
    [
      guest({
        introducedBy: '',
        actionNeeded: false,
        actionNote: '',
        angle: '',
        bio: '',
        confidence: 'low',
      }),
    ],
    { peopleResearchOk: false },
  );
  assert.match(text, /Nick Allen/);
  assert.match(text, /Overnight research did not run/);
});

test('the full schedule travels with the email: times, meta, attendees, blocks', () => {
  const text = compose([], {
    schedule: [
      {
        id: 'm1',
        title: 'Keystone QofE Discussion',
        time: '7:00 AM MT',
        duration: '45 min',
        attendees: [
          { name: 'Hank Tanner', initials: 'HT', color: '#000' },
          { name: 'Natalie Asher', initials: 'NA', color: '#000' },
        ],
        location: 'Shift',
        type: 'video',
        scheduleKind: 'meeting',
        startIso: '2026-08-04T13:00:00Z',
        flagged: false,
      },
      {
        id: 'b1',
        title: 'Inbox review',
        time: '4:30 PM MT',
        duration: '30 min',
        attendees: [],
        location: '',
        type: 'in-person',
        scheduleKind: 'other',
        startIso: '2026-08-04T22:30:00Z',
        flagged: false,
      },
    ],
  });
  assert.match(text, /TODAY'S SCHEDULE/);
  assert.match(text, /7:00 AM MT — Keystone QofE Discussion \(45 min · Shift · video\)/);
  assert.match(text, /With: Hank Tanner, Natalie Asher/);
  assert.match(text, /Blocks & holds: 4:30 PM MT Inbox review/);
});

test('every due-today and overdue task travels — no cap, with board names', () => {
  const dueToday = [
    {
      id: 't1',
      title: 'Talk to Alex Heckler about ESOP',
      project: 'Kory NON-IFG',
      assignee: 'Kory Mitchell',
      dueDate: 'Today',
      priority: 'high',
      status: 'due-today',
      flagged: false,
    },
  ];
  const overdue = Array.from({ length: 14 }, (_, i) => ({
    title: `Task ${i + 1}`,
    source: 'asana',
    daysOverdue: i + 1,
    priority: 'medium',
    project: 'Kory NON-IFG',
  }));
  const text = compose([], { dueToday, overdue });
  assert.match(text, /DUE TODAY/);
  assert.match(text, /Talk to Alex Heckler about ESOP — Kory NON-IFG · high priority/);
  // The old email stopped at 12 overdue items; all 14 must be present now.
  assert.match(text, /Task 2 — 2d overdue · Kory NON-IFG/);
  assert.match(text, /Task 1 — 1d overdue/);
  assert.equal((text.match(/d overdue/g) ?? []).length, 14);
});

test('flagged and unread inbox items travel; the rest are counted, not dumped', () => {
  const email = (i, over = {}) => ({
    id: `e${i}`,
    sender: `Sender ${i}`,
    senderInitials: 'S',
    senderColor: '#000',
    subject: `Subject ${i}`,
    preview: '',
    time: '2h ago',
    unread: true,
    flagged: false,
    priority: 'medium',
    labels: [],
    aiCategory: 'team',
    aiTriage: 'fyi',
    aiSummary: '',
    sentimentScore: 0,
    ...over,
  });
  const inbox = [
    email(0, { flagged: true, unread: false, sender: 'Lisa Sanchez', subject: 'Return flight info' }),
    ...Array.from({ length: 10 }, (_, i) => email(i + 1)),
  ];
  const text = compose([], { inbox, linkedInUnread: 3 });
  assert.match(text, /INBOX — FLAGGED & UNREAD/);
  assert.match(text, /Lisa Sanchez — Return flight info \(flagged · 2h ago\)/);
  assert.match(text, /Sender 8 — Subject 8/);
  // Only eight unread lines; the other two are a count.
  assert.doesNotMatch(text, /Sender 9 — Subject 9/);
  assert.match(text, /2 more unread — dashboard/);
  assert.match(text, /LinkedIn: 3 unread messages/);
});

test('html escapes untrusted text rather than emitting it raw', () => {
  const html = composeMorningEmailHtml({
    dateLabel: 'Tue',
    insights: ['<script>alert(1)</script>'],
    sections: [],
    overdue: [],
    people: [guest({ actionNote: 'a & b <tag>' })],
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /a &amp; b/);
});
