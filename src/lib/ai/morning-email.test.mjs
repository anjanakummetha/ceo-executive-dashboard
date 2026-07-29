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

const compose = (people) =>
  composeMorningEmailText({
    dateLabel: 'Tue, Aug 4',
    insights: [],
    sections: [],
    overdue: [],
    people,
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

test('a busy day compacts after three so the email cannot run away', () => {
  const many = ['A One', 'B Two', 'C Three', 'D Four', 'E Five'].map((name) =>
    guest({ name, email: `${name.split(' ')[0].toLowerCase()}@outside.com` }),
  );
  const text = compose(many);
  assert.match(text, /Also meeting: D Four .*, E Five/);
  assert.match(text, /full briefs on the dashboard/);
  // The first three keep their detail.
  assert.equal((text.match(/Introduced by Cody/g) ?? []).length, 3);
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
