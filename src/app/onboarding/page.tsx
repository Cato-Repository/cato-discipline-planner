"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/auth/AuthForm";
import { useStudyPlan } from "@/lib/use-study-plan";
import { useUser } from "@/lib/use-user";
import { getSuggestedTasks } from "@/lib/suggested-tasks";
import type { SubjectField, Task, TaskCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUBJECT_OPTIONS: { value: SubjectField; label: string }[] = [
  { value: "computer-science", label: "Computer Science" },
  { value: "social-science-humanities", label: "Social Science & Humanities" },
  { value: "arts", label: "Arts" },
  { value: "other", label: "Others" },
];

const STANDARD_TASK_OPTIONS: { category: TaskCategory; title: string }[] = [
  { category: "lecture", title: "Finish Lecture" },
  { category: "coding-project", title: "Coding Project" },
  { category: "problem-set", title: "Do Problem Set" },
];

interface DraftTask {
  id: string;
  title: string;
  category: TaskCategory;
  source: Task["source"];
}

const STEP_LABELS = ["Subject", "Tasks", "Deadlines"];

export default function OnboardingPage() {
  const router = useRouter();
  const { updatePlan } = useStudyPlan();
  const { user } = useUser();

  const [step, setStep] = useState(0);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [subject, setSubject] = useState<SubjectField | null>(null);
  const [checkedStandard, setCheckedStandard] = useState<Set<TaskCategory>>(new Set());
  const [checkedSuggested, setCheckedSuggested] = useState<Set<string>>(new Set());
  const [customTasks, setCustomTasks] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([]);
  const [deadlines, setDeadlines] = useState<Record<string, string>>({});

  const suggested = useMemo(() => getSuggestedTasks(subject), [subject]);

  function toggleStandard(category: TaskCategory) {
    setCheckedStandard((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function toggleSuggested(title: string) {
    setCheckedSuggested((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function addCustomTask() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    setCustomTasks((prev) => [...prev, trimmed]);
    setCustomInput("");
  }

  function removeCustomTask(title: string) {
    setCustomTasks((prev) => prev.filter((t) => t !== title));
  }

  function goToDeadlines() {
    const tasks: DraftTask[] = [
      ...STANDARD_TASK_OPTIONS.filter((o) => checkedStandard.has(o.category)).map((o) => ({
        id: crypto.randomUUID(),
        title: o.title,
        category: o.category,
        source: "user-added" as const,
      })),
      ...suggested
        .filter((s) => checkedSuggested.has(s.title))
        .map((s) => ({
          id: crypto.randomUUID(),
          title: s.title,
          category: s.category,
          source: "suggested" as const,
        })),
      ...customTasks.map((title) => ({
        id: crypto.randomUUID(),
        title,
        category: "other" as const,
        source: "user-added" as const,
      })),
    ];
    setDraftTasks(tasks);
    setStep(2);
  }

  function persistAndContinue() {
    const tasks: Task[] = draftTasks.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      deadline: new Date(deadlines[d.id]).toISOString(),
      status: "pending",
      source: d.source,
      priorityTier: null,
      pinned: false,
    }));

    updatePlan((prev) => ({ ...prev, subject, tasks }));
    router.push("/timetable");
  }

  function finish() {
    if (!user) {
      setStep(3);
      return;
    }
    persistAndContinue();
  }

  const canContinueFromTasks =
    checkedStandard.size > 0 || checkedSuggested.size > 0 || customTasks.length > 0;
  const canFinish = draftTasks.length > 0 && draftTasks.every((d) => deadlines[d.id]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex items-center justify-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                i === step ? "bg-primary" : i < step ? "bg-primary/50" : "bg-muted"
              )}
            />
            {i < STEP_LABELS.length - 1 && <div className="h-px w-6 bg-muted" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card className="gap-6 p-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold">Tell us what you study</h1>
            <p className="text-sm text-muted-foreground">
              This helps Cato tailor task suggestions to you.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SUBJECT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSubject(opt.value)}
                className={cn(
                  "rounded-lg border p-4 text-left text-sm font-medium transition-colors",
                  subject === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button disabled={!subject} onClick={() => setStep(1)} className="self-end">
            Continue
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="gap-6 p-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold">
              What tasks do you need to do to achieve your objective?
            </h1>
            <p className="text-sm text-muted-foreground">Select all that apply.</p>
          </div>

          <div className="flex flex-col gap-3">
            {STANDARD_TASK_OPTIONS.map((opt) => (
              <label
                key={opt.category}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50"
              >
                <Checkbox
                  checked={checkedStandard.has(opt.category)}
                  onCheckedChange={() => toggleStandard(opt.category)}
                />
                {opt.title}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-task">Others</Label>
            <div className="flex gap-2">
              <Input
                id="custom-task"
                placeholder="Describe a task"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTask();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addCustomTask}>
                Add
              </Button>
            </div>
            {customTasks.length > 0 && (
              <ul className="flex flex-col gap-2">
                {customTasks.map((title) => (
                  <li
                    key={title}
                    className="flex items-center justify-between rounded-lg border p-2 pl-3 text-sm"
                  >
                    {title}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomTask(title)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {suggested.length > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
              <p className="text-sm font-medium">Suggested for you</p>
              {suggested.map((s) => (
                <label key={s.title} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={checkedSuggested.has(s.title)}
                    onCheckedChange={() => toggleSuggested(s.title)}
                  />
                  {s.title}
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button disabled={!canContinueFromTasks} onClick={goToDeadlines}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="gap-6 p-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold">When do you need this done by?</h1>
            <p className="text-sm text-muted-foreground">
              Deadlines drive how urgently Cato schedules each task.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {draftTasks.map((d) => (
              <div key={d.id} className="flex flex-col gap-1.5">
                <Label htmlFor={`deadline-${d.id}`}>{d.title}</Label>
                <Input
                  id={`deadline-${d.id}`}
                  type="datetime-local"
                  value={deadlines[d.id] ?? ""}
                  onChange={(e) =>
                    setDeadlines((prev) => ({ ...prev, [d.id]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button disabled={!canFinish} onClick={finish}>
              Next: Your Timetable
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="gap-6 p-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold">Save your plan</h1>
            <p className="text-sm text-muted-foreground">
              Your answers are ready — {authMode === "signup" ? "sign up" : "log in"} to save
              them and build your schedule.
            </p>
          </div>

          <AuthForm mode={authMode} onSuccess={persistAndContinue} />

          <div className="flex items-center justify-between text-sm">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <button
              type="button"
              onClick={() => setAuthMode((m) => (m === "signup" ? "login" : "signup"))}
              className="text-muted-foreground underline underline-offset-2"
            >
              {authMode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
