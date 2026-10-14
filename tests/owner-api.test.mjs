import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as ownerAuth from '../lib/owner-auth.ts';

const env = { AUTH_MODE: 'standalone', ADMIN_KEY: 'owner chooses a private key', ADMIN_OWNER_ID: 'stable-owner' };
let requestHeaders = new Headers();
function load(path, imports) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', js)(name => { if (!(name in imports)) throw Error('Unexpected import: ' + name); return imports[name]; }, exports);
  return exports;
}
const route = load('app/api/owner/route.ts', { 'cloudflare:workers': { env }, '../../../lib/owner-auth': ownerAuth });
const auth = load('app/chatgpt-auth.ts', {
  'cloudflare:workers': { env }, '../lib/owner-auth': ownerAuth,
  'next/headers': { headers: async () => requestHeaders }, 'next/navigation': { redirect: () => { throw Error('redirect'); } },
});
const request = (key, origin = 'https://kairos.test', action) => new Request('https://kairos.test/api/owner', { method: 'POST', headers: { Origin: origin }, body: JSON.stringify({ key, action }) });
test('Standalone owner login fails closed and ignores forged Sites identity', async () => {
  requestHeaders = new Headers({ 'oai-authenticated-user-id': 'attacker', 'oai-authenticated-user-email': 'attacker@example.com' });
  assert.equal(await auth.getChatGPTUser(), null);
  assert.equal((await route.POST(request(env.ADMIN_KEY, 'https://other.test'))).status, 403);
  assert.equal((await route.POST(request(env.ADMIN_KEY, ''))).status, 403);
  assert.equal((await route.POST(request('invalid'))).status, 401);
  const response = await route.POST(request(env.ADMIN_KEY));
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  assert.equal(cookie.includes(env.ADMIN_KEY), false);
  assert.match(cookie, /__Host-kairos_room=; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=0/);
  requestHeaders.set('cookie', cookie.split(';')[0]);
  assert.equal((await auth.getChatGPTUser()).userId, 'stable-owner');
  env.ADMIN_KEY += ' rotated';
  assert.equal(await auth.getChatGPTUser(), null);
  const logout = await route.POST(request(undefined, 'https://kairos.test', 'logout'));
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  delete env.ADMIN_KEY;
  assert.equal((await route.POST(request('a long private key'))).status, 503);
});
