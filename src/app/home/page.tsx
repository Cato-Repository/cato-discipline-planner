"use client";

import { useEffect, useMemo } from "react";
import { StreakPanel } from "@/components/home/StreakPanel";
import { TaskList } from "@/components/home/TaskList";
import { WeeklySchedule } from "@/components/home/WeeklySchedule";
import { useStudyPlan } from "@/lib/use-study-plan";
import { computeDisciplineScore } from "@/lib/discipline";
import type { PriorityTier, SuggestedSlot, Task, TimetableCommitment } from "@/lib/types";

/** Only re-run /api/prioritize when the inputs that matter actually changed. */
function computeSignature(tasks: Task[], commitments: TimetableCommitment[]) {
  const rankable = tasks
    .filter((t) => t.status === "pending" && !t.pinned)
    .map((t) => `${t.id}:${t.deadline}`)
    .sort()
    .join("|");
  const commitmentSig = commitments
    .map((c) => `${c.id}:${c.day}:${c.startTime}-${c.endTime}`)
    .sort()
    .join("|");
  return `${rankable}::${commitmentSig}`;
}

export default function HomePage() {
  const { plan, updatePlan, hydrated } = useStudyPlan();

  const signature = useMemo(
    () => computeSignature(plan.tasks, plan.commitments),
    [plan.tasks, plan.commitments]
  );
  const isPrioritizing = plan.tasks.length > 0 && signature !== plan.lastPrioritizedSignature;

  useEffect(() => {
    if (!hydrated) return;
    if (plan.tasks.length === 0) return;
    if (signature === plan.lastPrioritizedSignature) return;

    let cancelled = false;

    fetch("/api/prioritize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: plan.tasks, commitments: plan.commitments }),
    })
      .then((res) => res.json())
      .then((data: { prioritizedTasks: { id: string; priorityTier: PriorityTier }[]; suggestedSlots: SuggestedSlot[] }) => {
        if (cancelled) return;
        updatePlan((prev) => {
          const tierById = new Map(data.prioritizedTasks.map((p) => [p.id, p.priorityTier]));
          return {
            ...prev,
            tasks: prev.tasks.map((t) => (tierById.has(t.id) ? { ...t, priorityTier: tierById.get(t.id)! } : t)),
            suggestedSlots: data.suggestedSlots,
            lastPrioritizedSignature: signature,
          };
        });
      })
      .catch((err) => console.error("Failed to prioritize tasks", err));

    return () => {
      cancelled = true;
    };
    // Only the signature (derived from tasks/commitments) should trigger a re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, signature]);

  function onChangeTier(taskId: string, tier: PriorityTier) {
    updatePlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, priorityTier: tier, pinned: true } : t)),
    }));
  }

  function onToggleStatus(taskId: string) {
    updatePlan((prev) => {
      const today = new Date().toISOString().slice(0, 10);
      const tasks = prev.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === "done" ? ("pending" as const) : ("done" as const) }
          : t
      );
      const justCompleted = tasks.find((t) => t.id === taskId)?.status === "done";
      const streakCount =
        justCompleted && prev.lastActiveDate !== today ? prev.streakCount + 1 : prev.streakCount;
      const lastActiveDate = justCompleted ? today : prev.lastActiveDate;

      return {
        ...prev,
        tasks,
        streakCount,
        lastActiveDate,
        disciplineScore: computeDisciplineScore(tasks, streakCount),
      };
    });
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-[240px_1fr_320px]">
      <StreakPanel streakCount={plan.streakCount} disciplineScore={plan.disciplineScore} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Your tasks</h1>
          {isPrioritizing && <span className="text-xs text-muted-foreground">Updating plan…</span>}
        </div>
        <TaskList tasks={plan.tasks} onChangeTier={onChangeTier} onToggleStatus={onToggleStatus} />
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold">This week</h1>
        <WeeklySchedule commitments={plan.commitments} suggestedSlots={plan.suggestedSlots} tasks={plan.tasks} />
      </div>
    </div>
  );
}
