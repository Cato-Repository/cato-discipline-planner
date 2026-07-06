# Cato

Pre-MVP of a studying companion web app: turn a rough list of tasks, deadlines, and
existing commitments into a prioritized, color-coded task list and a suggested
weekly timetable.

## Stack

- Next.js 16 (App Router) + Tailwind v4 + shadcn/ui
- Zod for the LLM's structured input/output schema
- Google Vertex AI (Gemini), called through the Vercel AI SDK (`ai` + `@ai-sdk/google-vertex`)
- Supabase (Postgres) for eventual persistence — see `supabase/migrations/0001_init.sql`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current state (pre-MVP scaffold)

This scaffold is fully click-through today **without any credentials**:

- Onboarding → timetable input → home page flow works end-to-end using
  `localStorage` (see `src/lib/use-study-plan.ts`) — there's no login/auth UI yet.
- The `/api/prioritize` route calls Google Vertex AI (Gemini) via `generateObject`
  when `GOOGLE_VERTEX_PROJECT` + credentials are set (see `.env.example`). Until
  then, it transparently falls back to a deterministic mock
  (`mockPrioritize` in `src/lib/llm/prioritize.ts`) that returns the exact same
  shape, so wiring up real credentials later requires no code changes.
- Supabase reads/writes are not yet wired into the UI — the schema exists
  (`supabase/migrations/0001_init.sql`) and the client helpers
  (`src/lib/supabase/`) return `null` until `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

## Known gaps / pre-MVP decisions made for you

These were open questions in the original product doc; here's what this
scaffold assumes so it could actually be built. Revisit as the product firms up:

- **Timetable input UI**: a click-and-drag weekly grid (`TimetableGrid.tsx`),
  not free-text/LLM-parsed or calendar import.
- **Task suggestions** (beyond what the user checks): a static per-subject rule
  set (`src/lib/suggested-tasks.ts`), not LLM-driven.
- **Discipline score formula**: a placeholder linear formula in
  `src/lib/discipline.ts` — streak/completions up, overdue tasks down.
- **Priority override behavior**: editing a task's tier in the UI "pins" it
  (`task.pinned`), excluding it from the next LLM re-ranking pass entirely.
- **Auth**: none. There's no login; state is per-browser via `localStorage`.
  The Supabase schema assumes a `users` row will eventually back this via
  Supabase Auth.

## Project structure

```
src/
  app/
    page.tsx              Landing page
    onboarding/page.tsx    Q1-Q3 onboarding wizard
    timetable/page.tsx     Weekly timetable grid input
    home/page.tsx          3-column task list + schedule + streak
    api/prioritize/route.ts LLM prioritization endpoint
  components/
    home/, timetable/, ui/  (shadcn/ui primitives)
  lib/
    types.ts               Shared domain types
    use-study-plan.ts       localStorage-backed plan state
    discipline.ts           Discipline score formula
    suggested-tasks.ts      Per-subject task suggestions
    llm/
      features.ts           Deterministic urgency/free-slot pre-processing
      schema.ts              Zod schema for the LLM's structured output
      prioritize.ts           Vertex AI call + mock fallback
    supabase/               Browser/server Supabase client helpers
supabase/migrations/0001_init.sql
```
