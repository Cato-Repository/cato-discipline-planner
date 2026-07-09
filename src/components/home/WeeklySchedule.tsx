"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/** How many weeks back/forward navigation is allowed to go, either direction. */
const MAX_WEEK_OFFSET = 8;

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
  const [weekOffset, setWeekOffset] = useState(0);
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const blocksByDay: Record<Weekday, Block[]> = Object.fromEntries(
    WEEKDAYS.map((day) => [day, [] as Block[]])
  ) as Record<Weekday, Block[]>;

  for (const c of commitments) {
    blocksByDay[c.day].push({ startTime: c.startTime, endTime: c.endTime, label: c.label, kind: "commitment" });
  }

  // Suggested study sessions are only ever computed for the current week (see
  // /api/prioritize) -- the "day" they're tagged with would be ambiguous
  // (which week's Monday?) if we tried to project them onto another week, so
  // they're only shown alongside the week they actually belong to.
  const showSuggestions = weekOffset === 0;
  if (showSuggestions) {
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
  }

  const hasAnything = commitments.length > 0 || (showSuggestions && suggestedSlots.length > 0);

  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7; // WEEKDAYS is Mon-first; Date#getDay is Sun-first

  // Columns run in actual chronological order starting from today (not a
  // fixed Mon-first order) -- this is a rolling 7-day window, not a calendar
  // week, so "Mon, Tue, Wed, Thu(today), Fri..." would show dates out of
  // order (e.g. 13, 14, 15, 9, 10...) the moment today isn't a Monday.
  const orderedDays = Array.from({ length: 7 }, (_, col) => WEEKDAYS[(todayIndex + col) % 7]);
  const weekDates = orderedDays.map((_, col) => {
    const offsetDays = col + weekOffset * 7;
    const date = new Date(now);
    date.setDate(now.getDate() + offsetDays);
    return date;
  });
  const rangeLabel = `${weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous week"
          disabled={weekOffset <= -MAX_WEEK_OFFSET}
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          <ChevronLeft />
        </Button>
        <button
          type="button"
          onClick={() => setWeekOffset(0)}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {weekOffset === 0 ? "This week" : rangeLabel}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next week"
          disabled={weekOffset >= MAX_WEEK_OFFSET}
          onClick={() => setWeekOffset((w) => w + 1)}
        >
          <ChevronRight />
        </Button>
      </div>

      {!hasAnything && (
        <p className="text-sm text-muted-foreground">
          {weekOffset === 0
            ? "Your suggested weekly schedule will show up here once your plan is built."
            : "No fixed commitments for this week."}
        </p>
      )}
      {commitments.length > 0 && !showSuggestions && (
        <p className="text-xs text-muted-foreground">
          Suggested study sessions are only planned for the current week.
        </p>
      )}
      <div className="grid grid-cols-7 gap-3">
        {orderedDays.map((day, col) => {
          const date = weekDates[col];
          const isToday = weekOffset === 0 && col === 0;

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