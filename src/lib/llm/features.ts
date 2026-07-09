import { WEEKDAYS, type TimetableCommitment, type Task, type Weekday } from "@/lib/types";

/** Study-able hours in a day, outside of which we don't suggest slots. */
const DAY_START_MINUTES = 7 * 60; // 07:00
const DAY_END_MINUTES = 23 * 60; // 23:00
const MIN_FREE_SLOT_MINUTES = 30;

export interface TaskFeatures {
  id: string;
  title: string;
  category: Task["category"];
  source: Task["source"];
  deadline: string; // ISO 8601, so slot placement can be checked against it
  hoursUntilDeadline: number;
  /** 0-100 rough urgency score, sooner deadline = higher. Not shown to the user. */
  urgencyBaseline: number;
}

export interface FreeSlot {
  day: Weekday;
  /** ISO "YYYY-MM-DD" real calendar date (in the student's local timezone) of this slot's next occurrence. */
  date: string;
  startTime: string; // "HH:mm", local to the student
  endTime: string; // "HH:mm", local to the student
  durationMinutes: number;
}

/**
 * This runs on the server (UTC on Vercel), but "today"/"this weekday"/"what
 * time is it" are all inherently local-to-the-student concepts -- a student
 * in UTC+8 whose local Thursday evening is still UTC-Thursday-morning on the
 * server must still see Thursday, not Wednesday. `timezoneOffsetMinutes` is
 * the student's own `Date#getTimezoneOffset()` (UTC minus local, in
 * minutes), sent by the client alongside the request. Every date/time
 * derivation below goes through this local-equivalent view via the UTC
 * getters/setters (deliberately, so the *server's* own local timezone never
 * leaks in), while epoch (`.getTime()`) comparisons stay untouched, since an
 * absolute instant needs no timezone adjustment.
 */
function toLocalView(now: Date, timezoneOffsetMinutes: number): Date {
  return new Date(now.getTime() - timezoneOffsetMinutes * 60_000);
}

/** Monday=0 ... Sunday=6, matching WEEKDAYS order (JS Date#getUTCDay is Sunday=0). */
function todayIndex(localView: Date): number {
  return (localView.getUTCDay() + 6) % 7;
}

/** Days from `localView` until the next occurrence of `day` (0 if `day` is today). */
function offsetToNextOccurrence(day: Weekday, localView: Date): number {
  return (WEEKDAYS.indexOf(day) - todayIndex(localView) + 7) % 7;
}

function formatDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Rough days-to-deadline urgency score (0-100). Deterministic, cheap, no LLM. */
export function computeUrgencyBaseline(deadline: string, now: Date = new Date()): number {
  const hoursUntilDeadline = (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilDeadline <= 0) return 100;
  if (hoursUntilDeadline >= 14 * 24) return 5; // 2+ weeks out
  // Inverse-ish curve: urgency falls off as deadline gets further away.
  const score = 100 - (hoursUntilDeadline / (14 * 24)) * 95;
  return Math.max(5, Math.min(100, Math.round(score)));
}

export function extractTaskFeatures(tasks: Task[], now: Date = new Date()): TaskFeatures[] {
  return tasks
    .filter((t) => t.status === "pending")
    .map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      source: t.source,
      deadline: t.deadline,
      hoursUntilDeadline: Math.round(
        (new Date(t.deadline).getTime() - now.getTime()) / (1000 * 60 * 60)
      ),
      urgencyBaseline: computeUrgencyBaseline(t.deadline, now),
    }));
}

/**
 * Computes open gaps per weekday, outside of existing fixed commitments.
 * Each weekday maps to its *next* real occurrence from `now` in the
 * student's own local timezone (today if it hasn't passed yet this week,
 * otherwise next week) -- so a weekday whose slot already elapsed today, or
 * earlier this week, is never offered.
 */
export function computeFreeSlots(
  commitments: TimetableCommitment[],
  now: Date = new Date(),
  timezoneOffsetMinutes = 0
): FreeSlot[] {
  const freeSlots: FreeSlot[] = [];
  const localView = toLocalView(now, timezoneOffsetMinutes);

  for (const day of WEEKDAYS) {
    const offsetDays = offsetToNextOccurrence(day, localView);
    const occurrence = new Date(localView);
    occurrence.setUTCHours(0, 0, 0, 0);
    occurrence.setUTCDate(occurrence.getUTCDate() + offsetDays);
    const date = formatDate(occurrence);

    const dayCommitments = commitments
      .filter((c) => c.day === day)
      .map((c) => ({ start: timeToMinutes(c.startTime), end: timeToMinutes(c.endTime) }))
      .sort((a, b) => a.start - b.start);

    let cursor = DAY_START_MINUTES;
    if (offsetDays === 0) {
      // Today: don't offer time that's already gone by.
      cursor = Math.max(cursor, localView.getUTCHours() * 60 + localView.getUTCMinutes());
    }

    for (const block of dayCommitments) {
      if (block.start > cursor) {
        const gap = block.start - cursor;
        if (gap >= MIN_FREE_SLOT_MINUTES) {
          freeSlots.push({
            day,
            date,
            startTime: minutesToTime(cursor),
            endTime: minutesToTime(block.start),
            durationMinutes: gap,
          });
        }
      }
      cursor = Math.max(cursor, block.end);
    }

    if (DAY_END_MINUTES > cursor) {
      const gap = DAY_END_MINUTES - cursor;
      if (gap >= MIN_FREE_SLOT_MINUTES) {
        freeSlots.push({
          day,
          date,
          startTime: minutesToTime(cursor),
          endTime: minutesToTime(DAY_END_MINUTES),
          durationMinutes: gap,
        });
      }
    }
  }

  return freeSlots;
}

/**
 * Real timestamp (ms) a free slot's start time falls on, given the same
 * `timezoneOffsetMinutes` its `date`/`startTime` were computed in. Mirrors
 * `toLocalView` in reverse: `date`+`startTime` are local wall-clock values,
 * so we build them as UTC components and shift back by the offset to get a
 * true, comparable epoch instant.
 */
export function slotStartInstant(slot: FreeSlot, timezoneOffsetMinutes = 0): number {
  const [year, month, day] = slot.date.split("-").map(Number);
  const [hours, minutes] = slot.startTime.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes) + timezoneOffsetMinutes * 60_000;
}