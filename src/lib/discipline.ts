import type { Task } from "./types";

/**
 * Placeholder discipline score formula (open question #3 in the product doc:
 * the real formula isn't designed yet). Rewards streaks and on-time completion,
 * penalizes overdue pending tasks. Replace once product defines the real rules.
 */
export function computeDisciplineScore(tasks: Task[], streakCount: number, now: Date = new Date()): number {
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => t.status === "pending" && new Date(t.deadline).getTime() < now.getTime()).length;

  const score = 50 + streakCount * 2 + done * 3 - overdue * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}
