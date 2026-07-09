import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchStudyPlan } from "@/lib/study-plan-data";
import { prioritizeTasks } from "@/lib/llm/prioritize";

/**
 * Re-runs the prioritization/scheduling step. Called from the client only when
 * tasks, deadlines, or the timetable change (see product doc trigger points) --
 * not on every page load.
 *
 * Authenticates the caller and re-reads their own tasks/commitments straight
 * from Supabase -- it never trusts task/commitment data supplied in the
 * request body, so a client can't get the model to reason over data it
 * doesn't actually own. The only thing we do trust from the body is the
 * caller's own timezone offset -- this server runs in UTC (Vercel), but
 * "today"/"this weekday" are inherently local-to-the-student concepts, and
 * a client can only ever skew its *own* schedule by lying about it.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const timezoneOffsetMinutes =
    typeof body?.timezoneOffsetMinutes === "number" && Number.isFinite(body.timezoneOffsetMinutes)
      ? body.timezoneOffsetMinutes
      : 0;

  const plan = await fetchStudyPlan(supabase, user.id);

  // Pinned tasks are manual overrides (open question #4): excluded from
  // re-ranking, their existing tier is kept as-is.
  const tasksToRank = plan.tasks.filter((t) => t.status === "pending" && !t.pinned);

  const result = await prioritizeTasks(tasksToRank, plan.commitments, timezoneOffsetMinutes);

  const writes: PromiseLike<unknown>[] = result.prioritizedTasks.map((p) =>
    supabase.from("tasks").update({ priority_tier: p.priorityTier }).eq("id", p.id).eq("user_id", user.id)
  );

  writes.push(
    (async () => {
      await supabase.from("suggested_slots").delete().eq("user_id", user.id);
      if (result.suggestedSlots.length > 0) {
        await supabase.from("suggested_slots").insert(
          result.suggestedSlots.map((s) => ({
            user_id: user.id,
            task_id: s.taskId,
            day: s.day,
            start_time: s.startTime,
            end_time: s.endTime,
          }))
        );
      }
    })()
  );

  await Promise.all(writes);

  return NextResponse.json(result);
}
