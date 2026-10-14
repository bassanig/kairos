export const ownerCookieName = '__Host-kairos_owner';
export const ownerSessionSeconds = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');

export function validOwnerKey(key: unknown): key is string {
  return typeof key === 'string' && key.length >= 16 && key.length <= 256;
}

export async function matchesOwnerKey(input: unknown, key: unknown) {
  if (!validOwnerKey(input) || !validOwnerKey(key)) return false;
  const [a, b] = await Promise.all([input, key].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function signingKey(key: string) {
  return crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createOwnerSession(key: string, now = Date.now()) {
  if (!validOwnerKey(key)) throw new Error('Owner key must have 16–256 characters.');
  const nonce = hex(crypto.getRandomValues(new Uint8Array(24)).buffer);
  const payload = `${Math.floor(now / 1000) + ownerSessionSeconds}.${nonce}`;
  const signature = await crypto.subtle.sign('HMAC', await signingKey(key), encoder.encode(payload));
  return `${payload}.${hex(signature)}`;
}

export async function verifyOwnerSession(session: string | undefined, key: unknown, now = Date.now()) {
  if (!validOwnerKey(key) || !session) return false;
  const match = /^(\d{10})\.([a-f0-9]{48})\.([a-f0-9]{64})$/.exec(session);
  if (!match) return false;
  const expiry = Number(match[1]), current = Math.floor(now / 1000);
  if (expiry <= current || expiry > current + ownerSessionSeconds) return false;
  const signature = Uint8Array.from(match[3].match(/../g)!, byte => parseInt(byte, 16));
  return crypto.subtle.verify('HMAC', await signingKey(key), signature, encoder.encode(`${match[1]}.${match[2]}`));
}

export function readOwnerSession(cookie: string | null) {
  return cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(ownerCookieName + '='))?.slice(ownerCookieName.length + 1);
}
