# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Fixed the schedule's day columns rendering in a fixed Mon-first order
  regardless of what day it actually is, which made the dates jump out of
  chronological order the moment "today" wasn't a Monday (e.g. Mon 13, Tue
  14, Wed 15, Thu 9, Fri 10...). Columns now always run chronologically
  starting from today.

### Added

- The "This week" schedule on `/tasks` now has Previous/Next week navigation,
  so fixed timetable commitments can be reviewed for past and future weeks
  (click the date range to jump back to the current week). Suggested study
  sessions are still only ever shown for the current week, since they're
  only computed for it -- other weeks show commitments only, with a note
  explaining why.

- Already-logged-in users hitting `/` are now redirected straight to
  `/tasks` instead of seeing the marketing landing page.
- The site header now shows a "Tasks" link for logged-in users (hidden while
  already on `/tasks`) for quick navigation back to the app.

### Fixed

- Fixed the scheduling engine computing "today"/weekday/time-of-day using the
  server's own clock (UTC, on Vercel) instead of the student's local
  timezone, which could shift which real day a task's suggested slot (and a
  fixed timetable commitment's displayed day) landed on for anyone not in
  UTC -- e.g. a task's study session appearing to jump to a different
  weekday after simply adding another task, since re-running the scheduler
  re-derives "today" from scratch each time. The client now sends its own
  timezone offset with each `/api/prioritize` call, and every date/weekday
  derivation on the server goes through that offset consistently.
- Fixed the scheduling engine having no concept of "today": free-slot
  computation and the mock prioritizer treated every weekday as equally
  available regardless of the current date, so a task could be suggested for
  a study slot on a day that had already passed this week (or after its own
  deadline). Weekdays now resolve to their next real calendar occurrence from
  now, past times today are excluded, and slot placement is checked against
  each task's actual deadline. The "This week" grid also now shows each
  column's real date and highlights today.

### Added

- Add, edit, and delete controls for tasks on the `/tasks` page: an inline
  "add a task" row, per-task edit (title + deadline) and delete buttons, plus
  an "Unsorted" section for tasks awaiting AI prioritization.

### Changed

- Widened the weekly schedule column on `/tasks` (was squeezed into a fixed
  320px sidebar) and gave its day cards more padding/font size for
  readability.

### Removed

- Removed the streak and discipline score panels from the `/tasks` page for
  now, along with the now-unused `StreakPanel` component.

## [0.1.0] - 2026-07-06

### Added

- Initial pre-MVP scaffold: Next.js 16 (App Router) + Tailwind v4 + shadcn/ui.
- Landing page, onboarding wizard (subject → tasks → deadlines), click-drag
  weekly timetable input, and a 3-column home page (streak, discipline score,
  prioritized task list, color-coded weekly schedule).
- `/api/prioritize` endpoint: deterministic urgency/free-slot pre-processing
  plus a Vertex AI (Gemini) prioritization call via the Vercel AI SDK, with a
  matching-shape mock fallback when credentials aren't configured.
- Supabase schema (`supabase/migrations/0001_init.sql`) and client helpers
  (not yet wired into the UI).
- Client-side study plan persistence via `localStorage` (no auth yet).
