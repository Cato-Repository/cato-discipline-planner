"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { useStudyPlan } from "@/lib/use-study-plan";
import type { TimetableCommitment } from "@/lib/types";

export default function TimetablePage() {
  const router = useRouter();
  const { plan, updatePlan, hydrated } = useStudyPlan();

  function addCommitment(commitment: Omit<TimetableCommitment, "id">) {
    updatePlan((prev) => ({
      ...prev,
      commitments: [...prev.commitments, { ...commitment, id: crypto.randomUUID() }],
    }));
  }

  function removeCommitment(id: string) {
    updatePlan((prev) => ({
      ...prev,
      commitments: prev.commitments.filter((c) => c.id !== id),
    }));
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">Block out your existing timetable</h1>
        <p className="text-sm text-muted-foreground">
          Click and drag across a day to mark a fixed commitment — classes, work, anything
          Cato should schedule around.
        </p>
      </div>

      <Card className="p-4">
        <TimetableGrid
          commitments={plan.commitments}
          onAdd={addCommitment}
          onRemove={removeCommitment}
        />
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => router.push("/home")}>Build my plan</Button>
      </div>
    </div>
  );
}
