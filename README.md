# NYU Maxxxxing

A public NYU campus-life platform. Students chat with an AI agent, find study
spaces and printers across both campuses, trade items on a marketplace, connect
with peer mentors, and find activity partners — no auth, no signup.

## Features

| Tab          | What it does                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chat**     | ChatGPT-style assistant with multi-tool agent, file attachments, and per-session user context (favorites + recent check-ins + active tab). |
| **Spaces**   | OpenStreetMap of NYU study spots with live "I'm Here / I'm Out" check-ins, noise/group/Zoom/outdoor/hidden-gem filters, favorites, LibCal booking links, and a "Submit a Hidden Gem" form. |
| **Printers** | Map of all 35 NYU print stations with crowd-sourced status reports (working/down/unverified), search-with-fly-to, and a Share Credits form that emails an attachment to a fellow student. |
| **Exchange** | Violet Exchange marketplace — list/edit/delete items, contact sellers via email or phone.                                                   |
| **Mentoring**| Browse peer mentors, book a session, get email confirmations. Resume-upload flow auto-fills mentor profiles via Claude.                     |
| **Partner**  | Find gym buddies, study groups, and activity partners. Join/leave flow with participant tracking.                                           |

The chat agent uses these tools so users can do most things by asking:
`searchSpaces`, `findOpenSpacesNow`, `listHiddenGems`, `searchListings`,
`searchMentors`, `checkPrinters`, `findNearbyPrinters`, `listStalePrinters`,
`nyuPrintInfo`, `sharePrintCredits`, `navigateTo`.

## Stack

- **Next.js 16** (App Router) + **React 19** + **Tailwind 4**
- **Drizzle ORM** over **Neon Postgres** (HTTP driver)
- **AgentBucket** (Bucket0) for file storage — chat attachments and shared print files
- **Leaflet + OpenStreetMap** (CartoDB Light/Dark tiles, theme-aware) for maps
- **AI SDK** (`@ai-sdk/react`, `@ai-sdk/openai`) — chat via **OpenRouter** (Gemini 2.0 Flash by default)
- **Anthropic SDK** — resume parsing for mentor profiles
- **Resend** — transactional email (credit shares, mentoring confirmations)

## Getting started

1. **Install deps**

   ```bash
   npm install
   ```

2. **Set env vars** in `.env.local` (see `.env.example`):

   | Variable             | Purpose                                              |
   | -------------------- | ---------------------------------------------------- |
   | `DATABASE_URL`       | Neon Postgres connection string                      |
   | `AGENT_BUCKET_KEY`   | Bucket0 AgentBucket key (starts with `b0ak_`)        |
   | `OPENROUTER_API_KEY` | Chat agent (chat completion)                         |
   | `OPENROUTER_MODEL`   | Optional override (default `google/gemini-2.0-flash-001`) |
   | `ANTHROPIC_API_KEY`  | Resume parsing for mentor onboarding                 |
   | `RESEND_API_KEY`     | Outbound email                                       |
   | `EMAIL_FROM`         | Optional sender override                             |

3. **Push schema to the DB** (first time):

   ```bash
   npm run db:push
   ```

4. **Run the dev server**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  (dashboard)/
    layout.tsx          # Sidebar + main content shell
    page.tsx            # Chat (default route, "/")
    chat-context.tsx    # User context provider (favorites, check-ins, chat reset)
    spaces/             # Map, side list, submit-spot modal, data
    printers/           # Map, list, report modal, share-credits form, server actions
    exchange/           # Marketplace listings + edit form
    mentoring/          # Mentor cards, booking modal, resume parsing
    partner/            # Activity partner listings
  api/
    chat/route.ts       # AI agent endpoint (streamed)
    parse-resume/       # Anthropic resume → structured fields
  components/           # Sidebar, theme toggle, markdown renderer
db/
  schema.ts             # Drizzle schema (spaces, printers, listings, mentors, ...)
  index.ts              # `db` client export
lib/
  agent-bucket.ts       # AgentBucket REST adapter (server-only)
  ai/tools.ts           # Agent tool definitions
```

## Scripts

| Command              | Action                                              |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Start dev server on `http://localhost:3000`         |
| `npm run build`      | Production build                                    |
| `npm run lint`       | ESLint (next/core-web-vitals + typescript)          |
| `npm run db:push`    | Push schema changes to Neon                         |
| `npm run db:generate`| Generate SQL migration files from schema diff       |
| `npm run db:migrate` | Run pending migrations                              |
| `npm run db:studio`  | Drizzle Studio at `https://local.drizzle.studio`    |

## Notes

- Path alias `@/*` resolves to the project root (e.g. `@/db`, `@/lib/agent-bucket`).
- `lib/agent-bucket.ts` is **server-only** — it reads `AGENT_BUCKET_KEY` and must not be imported in client components.
- Map components are dynamically imported with `ssr: false`; Leaflet needs `window`.
- Maps auto-switch between CartoDB Light Positron and Dark Matter tiles based on the active theme.
- The user-context blob (favorites + recent check-ins + active tab) persists in `localStorage` under `nyu-mx:user-context:v1`.
