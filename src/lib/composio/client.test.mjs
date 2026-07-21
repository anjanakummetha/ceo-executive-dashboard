// Read-only guard unit test (dashboard Part E.2).
// Run via:  npm run test:readonly   (uses tsx to load the .ts module on Node 20+)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertReadOnlyTool,
  READ_ONLY_TOOL_ALLOWLIST,
  executeComposioTool,
} from './client.ts';

test('all allowlisted read slugs pass the guard', () => {
  for (const slug of READ_ONLY_TOOL_ALLOWLIST) {
    assert.doesNotThrow(() => assertReadOnlyTool(slug), `expected ${slug} to pass`);
  }
});

test('write / mutating slugs are rejected before any network call', () => {
  const writes = [
    'OUTLOOK_SEND_EMAIL',
    'OUTLOOK_CREATE_CALENDAR_EVENT',
    'OUTLOOK_CREATE_ME_EVENT',
    'OUTLOOK_DELETE_MESSAGE',
    'OUTLOOK_UPDATE_CALENDAR_EVENT',
    'ASANA_CREATE_A_TASK',
    'ASANA_UPDATE_A_TASK',
    'ASANA_DELETE_TASK',
    'LINKEDIN_SEND_MESSAGE',
  ];
  for (const slug of writes) {
    assert.throws(() => assertReadOnlyTool(slug), /Read-only violation/, `expected ${slug} to throw`);
  }
});

test('a read-verb slug not on the allowlist is still rejected', () => {
  // Verb is fine but the exact slug is not enumerated → refused.
  assert.throws(() => assertReadOnlyTool('OUTLOOK_GET_SOME_UNLISTED_THING'), /Read-only violation/);
});

test('executeComposioTool throws on a write slug WITHOUT making a network call', async () => {
  const original = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error('network should not be reached');
  };
  try {
    await assert.rejects(
      () => executeComposioTool('OUTLOOK_SEND_EMAIL', {}, 'outlook'),
      /Read-only violation/,
    );
    assert.equal(fetchCalled, false, 'fetch must not be called for a rejected write');
  } finally {
    globalThis.fetch = original;
  }
});
