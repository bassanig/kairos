# Deploy Kairos on Cloudflare Free

Cloudflare Workers + D1 is the closest fit: Kairos already runs on Vinext and uses a D1 binding. No separate database service is required. A `workers.dev` address is included, so a purchased domain is optional.

Free allowances checked on October 14, 2026:

| Service | Free allowance |
| --- | --- |
| Workers | 100,000 requests/day; 10 ms CPU/request |
| D1 | 5 million rows read/day; 100,000 rows written/day; 5 GB total storage |

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/). CPU consumption must be measured on the deployed app; local builds cannot establish whether every request fits the free CPU limit. D1 queries stop when free daily allowances are exhausted.

Vercel Hobby is another free option for personal use, but moving this app there requires replacing its native D1 runtime integration. [Vercel Hobby documentation](https://vercel.com/docs/plans/hobby). GitHub Pages cannot run the authenticated API or database; a static export would lose saving and rooms.

## Install and verify

Use Node 22.13+ and the pinned pnpm version through Corepack. Run from this directory:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build:cloudflare
```

The Cloudflare build uses `vite.cloudflare.config.ts`, separate from the Sites preview configuration. It does not include mock identities or connector services.

## Create your free cloud resources

Create a Cloudflare account and keep Workers on the Free plan. Then:

```powershell
corepack pnpm exec wrangler login
corepack pnpm exec wrangler d1 create kairos
```

Copy the returned `database_id` into `wrangler.cloudflare.jsonc`, replacing the placeholder. Keep binding `DB` and migrations directory `./drizzle`. Choose an available Worker name if `kairos` is already used in your account.

`ADMIN_OWNER_ID` is the stable database owner for this deployment. Keep it unchanged when rotating the key. For existing Sites data, set it to the original owner's ID **before importing data**. A new Cloudflare database starts empty; this setup does not copy existing schedules automatically. Export the source D1 database and import a reviewed backup if you need to retain existing schedules, passwords and API tokens. Do not apply initial CREATE TABLE migrations over an already imported schema without reconciling migration history.

## Set your own private owner key

You choose the key. Set it using Wrangler's private interactive prompt:

```powershell
corepack pnpm exec wrangler secret put ADMIN_KEY --config wrangler.cloudflare.jsonc
```

Choose a unique, hard-to-guess passphrase of 16–256 characters and save it in your password manager. Do not put the key in a command argument, this document, `wrangler.cloudflare.jsonc`, Git or browser storage. Spaces are significant. If Wrangler asks to create the Worker before the first deploy, accept that creation.

The site does not have public first-user setup. `/owner` accepts only the key you configured in Cloudflare. Successful login issues a signed Secure/HttpOnly cookie valid for 30 days; the key itself is not in that cookie. Guests still use separate generated room passwords. The owner key grants full owner access to the deployment's single owner agenda.

To rotate or recover the key, run the same secret command and enter a new key. Rotation invalidates previous owner sessions and preserves room data. `/owner` also has a button to sign out the owner session on the current device. Room sessions are separate.

## Migrate, inspect and deploy

For a new empty database:

```powershell
corepack pnpm db:migrate:remote
corepack pnpm deploy:dry-run
corepack pnpm deploy
```

The deploy preflight rejects the placeholder database ID. A dry run bundles the Worker without publishing it. Neither command verifies that the secret has been configured; `/api/owner` refuses login with HTTP 503 if the owner key is missing or too short.

Wrangler prints `https://kairos.<your-subdomain>.workers.dev`. Open `/owner`, enter your key, then open **Sala e acesso → Ativar minha sala** to generate a separate guest password. Generate an AI key if you want external API access.

After publication, verify owner login, save/reload a task, guest editing in a separate browser, API token access and revision conflicts. Check Worker logs and CPU metrics to confirm the Free plan handles actual SSR and API workloads.

## Local standalone preview

```powershell
Copy-Item .dev.vars.example .dev.vars
# Edit .dev.vars privately and set ADMIN_KEY to your chosen local key.
corepack pnpm db:migrate:local
corepack pnpm dev:cloudflare
```

The local database is separate from production. Use localhost for Secure cookie development, and HTTPS on hosted deployments. `.dev.vars` is ignored by Git. Cloudflare bindings supply production settings; do not use client-side `NEXT_PUBLIC_` variables for secrets.

For a built production preview, run `corepack pnpm build:cloudflare` then `corepack pnpm preview:cloudflare`. The preview explicitly shares `.wrangler/state` with the local migration command.

## Repository setup

Deploying with Wrangler does not need a Git repository. For Git-based Cloudflare Builds, use a repository containing this app and set the root directory to the directory containing `package.json`. In the Worker's build settings, use:

| Setting | Command |
| --- | --- |
| Build command | `corepack pnpm deploy:check && corepack pnpm build:cloudflare` |
| Deploy command | `corepack pnpm exec wrangler deploy --config dist/server/wrangler.json` |

Provision the database, secret and migrations separately first. Commit the real D1 `database_id` in `wrangler.cloudflare.jsonc` before retrying the build.

Do not use `pnpm build` for this standalone deployment: it builds the Sites preview configuration from `vite.config.ts`, including the fictitious `site-creator-d1` database. If deployment fails with error 10181 referencing `00000000-0000-4000-8000-000000000000`, check both the build command and the production database ID. The production preflight stops this mistake before uploading assets.
