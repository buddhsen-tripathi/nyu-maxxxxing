# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NYU Maxxxxing — a public (no auth) NYU campus life platform. Students find study spaces, trade items on a marketplace, connect with peer mentors, and check printer status. The frontend is a ChatGPT-style AI assistant with sidebar navigation to each feature tab.

## Commands

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, next/core-web-vitals + typescript)
npm run db:push      # Push schema changes to Neon (no migration files)
npm run db:generate  # Generate SQL migration files from schema diff
npm run db:migrate   # Run pending migrations
npm run db:studio    # Visual DB browser at https://local.drizzle.studio
```

## Architecture

**Stack**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Drizzle ORM, Neon Postgres, AgentBucket (file storage).

**Routing**: All pages live under `app/(dashboard)/` which wraps content in a collapsible sidebar layout. The root page (`/`) is an AI chat interface; feature pages are `/spaces`, `/exchange`, `/mentoring`, `/printers`.

**Database** (`db/`):
- `db/schema.ts` — Drizzle schema. Tables: `spaces`, `listings`, `mentors`, `printers`, `printer_reports`. No users table — this is a public platform.
- `db/index.ts` — exports `db` (Drizzle client over Neon HTTP driver). Import as `import { db } from "@/db"`.
- `drizzle.config.ts` — loads env from `.env.local` via dotenv. Migrations output to `drizzle/`.

**File storage** (`lib/agent-bucket.ts`):
We use Bucket0 AgentBucket as our object storage instead of S3 — same upload/download/list/delete model but no AWS config, no bucket policies, no SDK setup. Just an HTTP API with a Bearer token.

The adapter in `lib/agent-bucket.ts` wraps the AgentBucket REST API (`https://bucket0.com/api/agent-bucket`) into typed functions. It is server-side only (reads `BUCKET0_AGENT_BUCKET` from env, must not be imported in client components). Usage:
- `upload(file, "exchange/photos/item-42.jpg")` — accepts `Blob` or `Buffer`, uses multipart form upload. Folders in the path are auto-created.
- `list(page?, pageSize?)` — paginated file listing.
- `download(key)` — returns raw `ArrayBuffer` by file key.
- `remove(key)` — deletes a file by key.
- `createFolder(path)` — creates an empty folder (rarely needed since upload auto-creates).

Use this for any user-uploaded content (listing photos, mentor profile images, documents). Store the returned `key` in the database to reference the file later. The adapter handles error mapping: 401 = bad key, 402 = plan limit, 429 = rate limited.

**Styling**: Tailwind 4 with CSS custom properties for theming (light/dark) defined in `app/globals.css`. Uses shadcn-style semantic color tokens (`--primary`, `--card`, `--sidebar`, etc.) with oklch values. Fonts: Montserrat (sans), Fira Code (mono).

**Components**: `app/components/sidebar.tsx` is the only shared component. Feature pages are self-contained with hardcoded data (not yet wired to the database).

## Environment variables

Defined in `.env.local` (gitignored). See `.env.example` for the template:
- `DATABASE_URL` — Neon Postgres connection string
- `BUCKET0_AGENT_BUCKET` — Bucket0 API key (starts with `b0ak_`)

## Path aliases

`@/*` maps to the project root (configured in `tsconfig.json`). Use `@/db`, `@/lib/agent-bucket`, etc.
