import { readFileSync } from 'node:fs';

// The checked-in config uses line comments, with no comment-like string values.
const config = JSON.parse(readFileSync(new URL('../wrangler.cloudflare.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const database = config.d1_databases?.find(value => value.binding === 'DB');
if (!database || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(database.database_id) || database.database_id === '00000000-0000-4000-8000-000000000000') {
  throw Error('Create kairos-db with Wrangler and set its real database_id in wrangler.cloudflare.jsonc before deployment.');
}
if (config.vars?.AUTH_MODE !== 'standalone' || !config.vars?.ADMIN_OWNER_ID) {
  throw Error('Standalone deployment requires AUTH_MODE=standalone and a stable ADMIN_OWNER_ID.');
}
console.log('Cloudflare configuration is ready. Set ADMIN_KEY using Wrangler’s secret prompt and apply remote migrations before serving users.');
