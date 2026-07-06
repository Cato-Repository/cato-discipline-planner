import { z } from "zod";
import { WEEKDAYS } from "@/lib/types";

export const priorityTierSchema = z.enum(["critical", "high", "medium", "low"]);

export const weekdaySchema = z.enum(WEEKDAYS);

/** One prioritized task, as decided by the LLM. */
export const prioritizedTaskSchema = z.object({
  id: z.string().describe("The task id, copied verbatim from the input."),
  priorityTier: priorityTierSchema.describe(
    "The priority tier for this task, weighing urgency, task type, and how full the student's schedule already is."
  ),
});

/** One suggested placement of a task into a free slot on the student's timetable. */
export const suggestedSlotSchema = z.object({
  taskId: z.string().describe("The task id this slot is for."),
  day: weekdaySchema,
  startTime: z.string().describe('24h "HH:mm" start time, must fall inside one of the provided free slots.'),
  endTime: z.string().describe('24h "HH:mm" end time, must fall inside one of the provided free slots.'),
});

export const prioritizeResponseSchema = z.object({
  prioritizedTasks: z.array(prioritizedTaskSchema),
  suggestedSlots: z.array(suggestedSlotSchema),
});

export type PrioritizeResponse = z.infer<typeof prioritizeResponseSchema>;
