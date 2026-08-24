# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a freshly scaffolded SvelteKit app (generated via `sv create`, see `README.md` for the exact
recreation command) with no custom features built yet — just a default page and a Drizzle schema stub.
Expect to be building the app's actual structure from near-scratch.

## Commands

```sh
npm run dev              # start dev server (add -- --open to launch a browser)
npm run build             # production build
npm run preview           # preview the production build

npm run check              # svelte-kit sync + svelte-check (type checking)
npm run check:watch        # same, in watch mode
npm run lint                # prettier --check . && eslint .
npm run format               # prettier --write .

npm run db:push               # push schema.ts changes to the SQLite db directly (dev)
npm run db:generate            # generate a drizzle migration from schema.ts changes
npm run db:migrate              # apply generated migrations
npm run db:studio                # open Drizzle Studio
```

There is no test runner configured yet (no `test` script, no test framework installed).

## Architecture

- **Svelte 5 in runes mode.** Runes mode is forced globally via `vite.config.ts` for everything under
  `src/` (not for `node_modules`), so `$props()`, `$state()`, etc. are always available without a
  per-file `<svelte:options>` opt-in — Svelte 6 will remove the need for this override.
- **Path aliases.** Import from the lib directory via `#lib` / `#lib/*` (defined in `package.json`
  `imports`, resolving to `./src/lib/index.js` / `./src/lib/*`), not the SvelteKit-default `$lib`.
  Anything meant to be imported this way should be re-exported from `src/lib/index.ts`.
- **Server-only code** lives under `src/lib/server/` (SvelteKit enforces this boundary — code here
  cannot be imported from client-side code).
- **Env vars** are declared with SvelteKit's typed env API (`@sveltejs/kit/env`, see `src/env.ts`) and
  consumed via the generated `$app/env/private` (see `src/lib/server/db/index.ts`). Add new required
  env vars to `src/env.ts`'s `defineEnvVars` call, not by reading `process.env` directly.
- **Database:** Drizzle ORM against SQLite using Node's built-in `node:sqlite` driver
  (`drizzle-orm/node-sqlite`), configured in `drizzle.config.ts` and `src/lib/server/db/index.ts`.
  Schema lives in `src/lib/server/db/schema.ts`; add tables there, then run `db:generate`/`db:migrate`
  (or `db:push` for quick local iteration) to sync the actual `local.db` file. `DATABASE_URL` (an env
  var, see `.env`/`.env.example`) points at the SQLite file.
- **Styling:** Tailwind CSS v4 via the Vite plugin (`@tailwindcss/vite`), not a PostCSS config. The
  single stylesheet entry point is `src/routes/layout.css` (imported from `+layout.svelte`), referenced
  directly by `prettier.config.js`'s `tailwindStylesheet` option so `prettier-plugin-tailwindcss` can
  sort classes correctly.
- **Auth:** `better-auth` is a dependency (with a `package.json` override pinning
  `@sveltejs/kit` to `next` for it) but is not yet wired up anywhere in `src/`.
- **Remote functions and async experimental features** are enabled in `vite.config.ts`
  (`experimental: { async: true }` compiler option, `experimental: { remoteFunctions: true }` kit
  option) — SvelteKit remote functions (`.remote.ts` files) are available for use.

## Formatting

Enforced by Prettier (`prettier.config.js`): tabs, single quotes, no trailing commas, 100-char print
width. `prettier-plugin-svelte` and `prettier-plugin-tailwindcss` (class sorting) run automatically —
always go through `npm run format` / `npm run lint` rather than hand-formatting.

## Tooling notes

- This repo has Svelte-specific AI tooling wired in for both Claude Code (`.claude/settings.json` adds
  the `svelte` marketplace and enables the `svelte@svelte` plugin) and opencode
  (`.opencode/opencode.json`). This exposes a **Svelte MCP server** with tools for Svelte 5/SvelteKit
  docs lookup and a Svelte autofixer. Per `AGENTS.md`: call `list-sections` first to discover doc
  topics, then `get-documentation` for the relevant ones before answering Svelte/SvelteKit questions,
  and run any newly written Svelte code through the `svelte-autofixer` tool until it reports no issues,
  before presenting it.
