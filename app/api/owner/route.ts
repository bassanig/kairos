import { env } from 'cloudflare:workers';
import { createOwnerSession, matchesOwnerKey, ownerCookieName, ownerSessionSeconds, validOwnerKey } from '../../../lib/owner-auth';

export async function POST(req: Request) {
  const respond = (body: unknown, status = 200, cookie?: string) => Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) },
  });
  if (env.AUTH_MODE !== 'standalone') return respond({ error: 'Login indisponível.' }, 404);
  if (req.headers.get('origin') !== new URL(req.url).origin) return respond({ error: 'Origem inválida.' }, 403);
  if (Number(req.headers.get('content-length')) > 4096) return respond({ error: 'Dados muito grandes.' }, 413);
  let body: { key?: unknown; action?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > 4096) return respond({ error: 'Dados muito grandes.' }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object') throw Error();
  } catch { return respond({ error: 'Dados inválidos.' }, 400); }
  const attributes = 'Path=/; HttpOnly; Secure; SameSite=Strict';
  if (body.action === 'logout') return respond({ ok: true }, 200, `${ownerCookieName}=; ${attributes}; Max-Age=0`);
  if (!validOwnerKey(env.ADMIN_KEY) || !env.ADMIN_OWNER_ID) return respond({ error: 'O proprietário precisa configurar a chave de acesso.' }, 503);
  if (!await matchesOwnerKey(body.key, env.ADMIN_KEY)) return respond({ error: 'Chave inválida.' }, 401);
  const session = await createOwnerSession(env.ADMIN_KEY);
  const response = respond({ ok: true }, 200, `${ownerCookieName}=${session}; ${attributes}; Max-Age=${ownerSessionSeconds}`);
  // An earlier guest cookie must not override the newly selected owner agenda.
  response.headers.append('Set-Cookie', `__Host-kairos_room=; ${attributes}; Max-Age=0`);
  return response;
}
