import { NextResponse } from "next/server";
import { z } from "zod";
import { prioritizeTasks } from "@/lib/llm/prioritize";
import { WEEKDAYS } from "@/lib/types";
import type { Task, TimetableCommitment } from "@/lib/types";

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["lecture", "coding-project", "problem-set", "other"]),
  deadline: z.string(),
  status: z.enum(["pending", "done"]),
  source: z.enum(["user-added", "suggested"]),
  priorityTier: z.enum(["critical", "high", "medium", "low"]).nullable(),
  pinned: z.boolean(),
});

const commitmentSchema = z.object({
  id: z.string(),
  day: z.enum(WEEKDAYS),
  startTime: z.string(),
  endTime: z.string(),
  label: z.string(),
});

const requestSchema = z.object({
  tasks: z.array(taskSchema),
  commitments: z.array(commitmentSchema),
});

/**
 * Re-runs the prioritization/scheduling step. Called from the client only when
 * tasks, deadlines, or the timetable change (see product doc trigger points) --
 * not on every page load.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { tasks, commitments } = parsed.data;

  // Pinned tasks are manual overrides (open question #4): excluded from
  // re-ranking, their existing tier is kept as-is by the caller.
  const tasksToRank = tasks.filter((t) => t.status === "pending" && !t.pinned);

  const result = await prioritizeTasks(tasksToRank as Task[], commitments as TimetableCommitment[]);
  return NextResponse.json(result);
}
