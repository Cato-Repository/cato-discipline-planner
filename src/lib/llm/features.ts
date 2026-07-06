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
  hoursUntilDeadline: number;
  /** 0-100 rough urgency score, sooner deadline = higher. Not shown to the user. */
  urgencyBaseline: number;
}

export interface FreeSlot {
  day: Weekday;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  durationMinutes: number;
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
      hoursUntilDeadline: Math.round(
        (new Date(t.deadline).getTime() - now.getTime()) / (1000 * 60 * 60)
      ),
      urgencyBaseline: computeUrgencyBaseline(t.deadline, now),
    }));
}

/** Computes open gaps per weekday, outside of existing fixed commitments. */
export function computeFreeSlots(commitments: TimetableCommitment[]): FreeSlot[] {
  const freeSlots: FreeSlot[] = [];

  for (const day of WEEKDAYS) {
    const dayCommitments = commitments
      .filter((c) => c.day === day)
      .map((c) => ({ start: timeToMinutes(c.startTime), end: timeToMinutes(c.endTime) }))
      .sort((a, b) => a.start - b.start);

    let cursor = DAY_START_MINUTES;
    for (const block of dayCommitments) {
      if (block.start > cursor) {
        const gap = block.start - cursor;
        if (gap >= MIN_FREE_SLOT_MINUTES) {
          freeSlots.push({
            day,
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
          startTime: minutesToTime(cursor),
          endTime: minutesToTime(DAY_END_MINUTES),
          durationMinutes: gap,
        });
      }
    }
  }

  return freeSlots;
}
