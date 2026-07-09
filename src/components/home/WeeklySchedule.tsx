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

  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7; // WEEKDAYS is Mon-first; Date#getDay is Sun-first

  return (
    <div className="flex flex-col gap-3">
      {!hasAnything && (
        <p className="text-sm text-muted-foreground">
          Your suggested weekly schedule will show up here once your plan is built.
        </p>
      )}
      <div className="grid grid-cols-7 gap-3">
        {WEEKDAYS.map((day, i) => {
          const offsetDays = (i - todayIndex + 7) % 7;
          const isToday = offsetDays === 0;
          const date = new Date(now);
          date.setDate(now.getDate() + offsetDays);

          return (
            <div key={day} className={cn("flex flex-col gap-2 rounded-lg", isToday && "bg-muted/40 p-1.5 -m-1.5")}>
              <p className={cn("text-center text-sm font-medium", isToday ? "text-foreground" : "text-muted-foreground")}>
                {DAY_LABELS[day]}
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </p>
              <div className="flex flex-col gap-2">
                {blocksByDay[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((block, bi) => (
                    <Card
                      key={bi}
                      className={cn(
                        "gap-1 border p-2.5 text-xs leading-snug",
                        block.kind === "commitment" ? "bg-muted/60 text-muted-foreground" : block.colorClass
                      )}
                    >
                      <span className="font-medium break-words">{block.label}</span>
                      <span className="text-[11px] opacity-80">
                        {block.startTime}–{block.endTime}
                      </span>
                    </Card>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
