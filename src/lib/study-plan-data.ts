import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PriorityTier,
  StudyPlan,
  SubjectField,
  SuggestedSlot,
  Task,
  TimetableCommitment,
  Weekday,
} from "@/lib/types";

export const EMPTY_PLAN: StudyPlan = {
  subject: null,
  tasks: [],
  commitments: [],
  suggestedSlots: [],
  streakCount: 0,
  disciplineScore: 50,
  lastActiveDate: null,
  lastPrioritizedSignature: null,
};

// The signature cache is a pure UI cost-control optimization (see
// /api/prioritize's trigger-point comment) -- it's not real app data, so it
// lives in localStorage per-user rather than round-tripping through Supabase.
function signatureStorageKey(userId: string) {
  return `cato:last-prioritized-signature:${userId}`;
}

function readCachedSignature(userId: string): string | null {
  try {
    return window.localStorage.getItem(signatureStorageKey(userId));
  } catch {
    return null;
  }
}

function writeCachedSignature(userId: string, signature: string | null) {
  try {
    if (signature === null) {
      window.localStorage.removeItem(signatureStorageKey(userId));
    } else {
      window.localStorage.setItem(signatureStorageKey(userId), signature);
    }
  } catch {
    // Non-fatal; worst case the prioritize step re-runs once more than necessary.
  }
}

interface UserRow {
  subject: SubjectField | null;
  streak_count: number;
  discipline_score: number;
  last_active_date: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  category: Task["category"];
  deadline: string;
  priority_tier: PriorityTier | null;
  status: Task["status"];
  source: Task["source"];
  pinned: boolean;
}

interface CommitmentRow {
  id: string;
  day: Weekday;
  start_time: string;
  end_time: string;
  label: string;
}

interface SlotRow {
  task_id: string;
  day: Weekday;
  start_time: string;
  end_time: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    deadline: row.deadline,
    priorityTier: row.priority_tier,
    status: row.status,
    source: row.source,
    pinned: row.pinned,
  };
}

function rowToCommitment(row: CommitmentRow): TimetableCommitment {
  return {
    id: row.id,
    day: row.day,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    label: row.label,
  };
}

function rowToSlot(row: SlotRow): SuggestedSlot {
  return {
    taskId: row.task_id,
    day: row.day,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  };
}

function taskToRow(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    category: task.category,
    deadline: task.deadline,
    priority_tier: task.priorityTier,
    status: task.status,
    source: task.source,
    pinned: task.pinned,
  };
}

function commitmentToRow(commitment: TimetableCommitment, userId: string) {
  return {
    id: commitment.id,
    user_id: userId,
    day: commitment.day,
    start_time: commitment.startTime,
    end_time: commitment.endTime,
    label: commitment.label,
  };
}

function slotToRow(slot: SuggestedSlot, userId: string) {
  return {
    user_id: userId,
    task_id: slot.taskId,
    day: slot.day,
    start_time: slot.startTime,
    end_time: slot.endTime,
  };
}

/** Whether this user has ever completed onboarding (has at least one task). */
export async function hasStudyPlanData(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}

export async function fetchStudyPlan(supabase: SupabaseClient, userId: string): Promise<StudyPlan> {
  const [userResult, taskResult, commitmentResult, slotResult] = await Promise.all([
    supabase.from("users").select("subject, streak_count, discipline_score, last_active_date").eq("id", userId).single(),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("timetable_commitments").select("*").eq("user_id", userId),
    supabase.from("suggested_slots").select("*").eq("user_id", userId),
  ]);

  const userRow = userResult.data as UserRow | null;

  return {
    subject: userRow?.subject ?? null,
    streakCount: userRow?.streak_count ?? 0,
    disciplineScore: userRow?.discipline_score ?? 50,
    lastActiveDate: userRow?.last_active_date ?? null,
    tasks: ((taskResult.data as TaskRow[] | null) ?? []).map(rowToTask),
    commitments: ((commitmentResult.data as CommitmentRow[] | null) ?? []).map(rowToCommitment),
    suggestedSlots: ((slotResult.data as SlotRow[] | null) ?? []).map(rowToSlot),
    lastPrioritizedSignature: readCachedSignature(userId),
  };
}

/** Diffs `prev` against `next` and issues only the Supabase writes actually needed. */
export async function syncStudyPlan(
  supabase: SupabaseClient,
  userId: string,
  prev: StudyPlan,
  next: StudyPlan
): Promise<void> {
  const writes: PromiseLike<unknown>[] = [];

  const userPatch: Partial<UserRow> = {};
  if (next.subject !== prev.subject) userPatch.subject = next.subject;
  if (next.streakCount !== prev.streakCount) userPatch.streak_count = next.streakCount;
  if (next.disciplineScore !== prev.disciplineScore) userPatch.discipline_score = next.disciplineScore;
  if (next.lastActiveDate !== prev.lastActiveDate) userPatch.last_active_date = next.lastActiveDate;
  if (Object.keys(userPatch).length > 0) {
    writes.push(supabase.from("users").update(userPatch).eq("id", userId));
  }

  const nextTaskIds = new Set(next.tasks.map((t) => t.id));
  const changedTasks = next.tasks.filter((t) => {
    const before = prev.tasks.find((p) => p.id === t.id);
    return !before || JSON.stringify(before) !== JSON.stringify(t);
  });
  const deletedTaskIds = prev.tasks.map((t) => t.id).filter((id) => !nextTaskIds.has(id));
  if (changedTasks.length > 0) {
    writes.push(supabase.from("tasks").upsert(changedTasks.map((t) => taskToRow(t, userId))));
  }
  if (deletedTaskIds.length > 0) {
    writes.push(supabase.from("tasks").delete().in("id", deletedTaskIds));
  }

  const changedCommitments = next.commitments.filter((c) => {
    const before = prev.commitments.find((p) => p.id === c.id);
    return !before || JSON.stringify(before) !== JSON.stringify(c);
  });
  const nextCommitmentIds = new Set(next.commitments.map((c) => c.id));
  const deletedCommitmentIds = prev.commitments.map((c) => c.id).filter((id) => !nextCommitmentIds.has(id));
  if (changedCommitments.length > 0) {
    writes.push(supabase.from("timetable_commitments").upsert(changedCommitments.map((c) => commitmentToRow(c, userId))));
  }
  if (deletedCommitmentIds.length > 0) {
    writes.push(supabase.from("timetable_commitments").delete().in("id", deletedCommitmentIds));
  }

  // suggested_slots have no client-visible id (they're always replaced wholesale
  // by the prioritize step), so a changed array means "replace everything".
  if (JSON.stringify(prev.suggestedSlots) !== JSON.stringify(next.suggestedSlots)) {
    writes.push(
      (async () => {
        await supabase.from("suggested_slots").delete().eq("user_id", userId);
        if (next.suggestedSlots.length > 0) {
          await supabase.from("suggested_slots").insert(next.suggestedSlots.map((s) => slotToRow(s, userId)));
        }
      })()
    );
  }

  if (next.lastPrioritizedSignature !== prev.lastPrioritizedSignature) {
    writeCachedSignature(userId, next.lastPrioritizedSignature);
  }

  await Promise.all(writes);
}
