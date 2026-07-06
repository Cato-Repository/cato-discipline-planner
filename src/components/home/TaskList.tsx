"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY_TIER_COLORS, PRIORITY_TIER_LABELS, type PriorityTier, type Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIER_ORDER: PriorityTier[] = ["critical", "high", "medium", "low"];

interface TaskListProps {
  tasks: Task[];
  onChangeTier: (taskId: string, tier: PriorityTier) => void;
  onToggleStatus: (taskId: string) => void;
}

export function TaskList({ tasks, onChangeTier, onToggleStatus }: TaskListProps) {
  const pending = tasks.filter((t) => t.status === "pending");
  const done = tasks.filter((t) => t.status === "done");
  const unranked = pending.filter((t) => !t.priorityTier);

  return (
    <div className="flex flex-col gap-6">
      {unranked.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Building your prioritized plan…
        </p>
      )}

      {TIER_ORDER.map((tier) => {
        const tierTasks = pending.filter((t) => t.priorityTier === tier);
        if (tierTasks.length === 0) return null;
        const colors = PRIORITY_TIER_COLORS[tier];

        return (
          <div key={tier} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", colors.bg.replace("/15", ""))} />
              <h2 className="text-sm font-semibold">{PRIORITY_TIER_LABELS[tier]}</h2>
            </div>
            <div className="flex flex-col gap-2">
              {tierTasks.map((task) => (
                <Card
                  key={task.id}
                  className={cn("flex-row items-center justify-between gap-3 border p-3", colors.border)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => onToggleStatus(task.id)}
                      aria-label={`Mark ${task.title} done`}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Due {new Date(task.deadline).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {task.pinned && " · pinned"}
                      </span>
                    </div>
                  </div>
                  <Select value={tier} onValueChange={(value) => onChangeTier(task.id, value as PriorityTier)}>
                    <SelectTrigger size="sm" className="w-[110px]" aria-label={`Edit priority for ${task.title}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_ORDER.map((t) => (
                        <SelectItem key={t} value={t}>
                          {PRIORITY_TIER_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Done</h2>
          <div className="flex flex-col gap-2">
            {done.map((task) => (
              <Card key={task.id} className="flex-row items-center gap-3 p-3 opacity-60">
                <Checkbox checked onCheckedChange={() => onToggleStatus(task.id)} />
                <span className="text-sm line-through">{task.title}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No tasks yet — head back to onboarding to add some.</p>
      )}
    </div>
  );
}
