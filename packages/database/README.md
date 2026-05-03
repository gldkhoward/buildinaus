# @buildinaus/database

Drizzle schema + client for the BuildinAus app.

## Provider

Vercel Postgres is no longer offered as a first-party product. Provision a
Postgres instance from the Vercel Marketplace (Neon recommended) and set
`DATABASE_URL` in your env. The Drizzle driver here uses `postgres-js`, which
works with any Postgres-compatible URL.

## Scripts

- `pnpm db:generate` — generate SQL migrations from schema diffs
- `pnpm db:migrate` — apply pending migrations
- `pnpm db:push` — push schema directly (dev only)
- `pnpm db:seed` — load demo rows for the pitch
