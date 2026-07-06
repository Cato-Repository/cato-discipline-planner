import { Card } from "@/components/ui/card";
import {
  PRIORITY_TIER_COLORS,
  WEEKDAYS,
  type SuggestedSlot,
  type Task,
  type TimetableCommitment,
  type Weekday,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_LABELS: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface WeeklyScheduleProps {
  commitments: TimetableCommitment[];
  suggestedSlots: SuggestedSlot[];
  tasks: Task[];
}

interface Block {
  startTime: string;
  endTime: string;
  label: string;
  kind: "commitment" | "task";
  colorClass?: string;
}

export function WeeklySchedule({ commitments, suggestedSlots, tasks }: WeeklyScheduleProps) {
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const blocksByDay: Record<Weekday, Block[]> = Object.fromEntries(
    WEEKDAYS.map((day) => [day, [] as Block[]])
  ) as Record<Weekday, Block[]>;

  for (const c of commitments) {
    blocksByDay[c.day].push({ startTime: c.startTime, endTime: c.endTime, label: c.label, kind: "commitment" });
  }

  for (const slot of suggestedSlots) {
    const task = taskById.get(slot.taskId);
    if (!task) continue;
    const colors = task.priorityTier ? PRIORITY_TIER_COLORS[task.priorityTier] : undefined;
    blocksByDay[slot.day].push({
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: task.title,
      kind: "task",
      colorClass: colors ? cn(colors.bg, colors.text, colors.border) : undefined,
    });
  }

  const hasAnything = commitments.length > 0 || suggestedSlots.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {!hasAnything && (
        <p className="text-sm text-muted-foreground">
          Your suggested weekly schedule will show up here once your plan is built.
        </p>
      )}
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="flex flex-col gap-2">
            <p className="text-center text-xs font-medium text-muted-foreground">{DAY_LABELS[day]}</p>
            <div className="flex flex-col gap-1.5">
              {blocksByDay[day]
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((block, i) => (
                  <Card
                    key={i}
                    className={cn(
                      "gap-0.5 border p-2 text-[11px] leading-tight",
                      block.kind === "commitment" ? "bg-muted/60 text-muted-foreground" : block.colorClass
                    )}
                  >
                    <span className="font-medium">{block.label}</span>
                    <span className="text-[10px] opacity-80">
                      {block.startTime}–{block.endTime}
                    </span>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
