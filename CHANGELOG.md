# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
