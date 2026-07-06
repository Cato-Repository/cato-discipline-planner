import { generateObject } from "ai";
import { createVertex } from "@ai-sdk/google-vertex";
import { prioritizeResponseSchema, type PrioritizeResponse } from "./schema";
import { computeFreeSlots, extractTaskFeatures, type FreeSlot, type TaskFeatures } from "./features";
import type { Task, TimetableCommitment } from "@/lib/types";

const MODEL_ID = process.env.VERTEX_MODEL_ID ?? "gemini-2.5-flash";

/** Vertex AI is only called once real credentials exist; until then we use `mockPrioritize`. */
function isVertexConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_VERTEX_PROJECT &&
      (process.env.GOOGLE_VERTEX_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  );
}

function buildVertexModel() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const vertex = createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT,
    location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
    ...(credentialsJson ? { googleAuthOptions: { credentials: JSON.parse(credentialsJson) } } : {}),
  });
  return vertex(MODEL_ID);
}

function buildPrompt(features: TaskFeatures[], freeSlots: FreeSlot[]): string {
  return [
    "You are the scheduling engine for a student discipline app.",
    "Assign each task a priority tier, and where a sensible free slot exists, a suggested placement.",
    "Favor urgent, high-stakes tasks for 'critical'/'high'. Never suggest a slot shorter than the task realistically needs, and never suggest a slot outside the given free slots.",
    "",
    `Tasks (with a deterministic urgency baseline from 0-100 as a rough starting point, not the final answer):\n${JSON.stringify(features, null, 2)}`,
    "",
    `Free time slots on the student's timetable:\n${JSON.stringify(freeSlots, null, 2)}`,
  ].join("\n");
}

/**
 * Deterministic pre-processing (features/free slots) happens in `features.ts`.
 * This is the one LLM call in the pipeline: it decides priority tiers and slot
 * placements from that compact structured input, per the product's hybrid
 * approach (code does the groundwork, the model makes the call).
 */
export async function prioritizeTasks(
  tasks: Task[],
  commitments: TimetableCommitment[]
): Promise<PrioritizeResponse> {
  const features = extractTaskFeatures(tasks);
  const freeSlots = computeFreeSlots(commitments);

  if (features.length === 0) {
    return { prioritizedTasks: [], suggestedSlots: [] };
  }

  if (isVertexConfigured()) {
    try {
      const { object } = await generateObject({
        model: buildVertexModel(),
        schema: prioritizeResponseSchema,
        schemaName: "PrioritizedStudyPlan",
        schemaDescription:
          "Priority tiers and suggested timetable placements for a student's pending tasks.",
        prompt: buildPrompt(features, freeSlots),
      });
      return object;
    } catch (error) {
      console.error("Vertex AI prioritization call failed, falling back to mock output.", error);
    }
  }

  return mockPrioritize(features, freeSlots);
}

function mockPrioritize(features: TaskFeatures[], freeSlots: FreeSlot[]): PrioritizeResponse {
  const sorted = [...features].sort((a, b) => b.urgencyBaseline - a.urgencyBaseline);

  const tierForRank = (rank: number, total: number): PrioritizeResponse["prioritizedTasks"][number]["priorityTier"] => {
    const percentile = rank / total;
    if (percentile < 0.15) return "critical";
    if (percentile < 0.45) return "high";
    if (percentile < 0.8) return "medium";
    return "low";
  };

  const prioritizedTasks = sorted.map((f, i) => ({
    id: f.id,
    priorityTier: tierForRank(i, sorted.length),
  }));

  const suggestedSlots: PrioritizeResponse["suggestedSlots"] = [];
  const remainingSlots = freeSlots
    .filter((s) => s.durationMinutes >= 30)
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .map((s) => ({ ...s }));

  for (const task of sorted) {
    const slotIndex = remainingSlots.findIndex((s) => s.durationMinutes >= 30);
    if (slotIndex === -1) break;
    const slot = remainingSlots[slotIndex];
    const blockMinutes = Math.min(60, slot.durationMinutes);
    const [h, m] = slot.startTime.split(":").map(Number);
    const startTotal = h * 60 + m;
    const endTotal = startTotal + blockMinutes;
    const endTime = `${Math.floor(endTotal / 60).toString().padStart(2, "0")}:${(endTotal % 60)
      .toString()
      .padStart(2, "0")}`;

    suggestedSlots.push({ taskId: task.id, day: slot.day, startTime: slot.startTime, endTime });

    slot.startTime = endTime;
    slot.durationMinutes -= blockMinutes;
    if (slot.durationMinutes < 30) {
      remainingSlots.splice(slotIndex, 1);
    }
  }

  return { prioritizedTasks, suggestedSlots };
}
