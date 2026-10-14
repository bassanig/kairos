import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerSession, matchesOwnerKey, ownerCookieName, ownerSessionSeconds, readOwnerSession, verifyOwnerSession } from '../lib/owner-auth.ts';

const key = 'a private key chosen by the owner';
const now = 1_800_000_000_000;
test('Owner key is chosen by the user and compared without trimming', async () => {
  assert.equal(await matchesOwnerKey(key, key), true);
  assert.equal(await matchesOwnerKey(key + ' ', key), false);
  assert.equal(await matchesOwnerKey('short', 'short'), false);
  assert.equal(await matchesOwnerKey(key, undefined), false);
});
test('Signed owner session expires, rejects tampering and is revoked by key rotation', async () => {
  const session = await createOwnerSession(key, now);
  assert.equal(session.includes(key), false);
  assert.equal(await verifyOwnerSession(session, key, now), true);
  assert.equal(await verifyOwnerSession(session, key + ' rotated', now), false);
  assert.equal(await verifyOwnerSession(session, key, now + ownerSessionSeconds * 1000), false);
  assert.equal(await verifyOwnerSession(session, key, now - 1000), false);
  assert.equal(await verifyOwnerSession(session.replace(/^\d/, '9'), key, now), false);
  assert.equal(await verifyOwnerSession('forged', key, now), false);
  assert.equal(await verifyOwnerSession(session, undefined, now), false);
  assert.equal(readOwnerSession(`other=value; ${ownerCookieName}=${session}`), session);
});
