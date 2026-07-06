"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { WEEKDAYS, type TimetableCommitment, type Weekday } from "@/lib/types";

const DAY_LABELS: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const START_HOUR = 7;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function hourToTime(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

interface Selection {
  day: Weekday;
  anchorRow: number;
  hoverRow: number;
}

interface PendingBlock {
  day: Weekday;
  startTime: string;
  endTime: string;
}

interface TimetableGridProps {
  commitments: TimetableCommitment[];
  onAdd: (commitment: Omit<TimetableCommitment, "id">) => void;
  onRemove: (id: string) => void;
}

export function TimetableGrid({ commitments, onAdd, onRemove }: TimetableGridProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pending, setPending] = useState<PendingBlock | null>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    function endDrag() {
      setSelection((sel) => {
        if (sel) {
          const from = Math.min(sel.anchorRow, sel.hoverRow);
          const to = Math.max(sel.anchorRow, sel.hoverRow) + 1;
          setPending({
            day: sel.day,
            startTime: hourToTime(START_HOUR + from),
            endTime: hourToTime(START_HOUR + to),
          });
        }
        return null;
      });
    }
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);

  function commitmentAt(day: Weekday, hour: number) {
    return commitments.find((c) => {
      if (c.day !== day) return false;
      const [startH] = c.startTime.split(":").map(Number);
      const [endH, endM] = c.endTime.split(":").map(Number);
      const endHour = endM > 0 ? endH + 1 : endH;
      return hour >= startH && hour < endHour;
    });
  }

  function isSelected(day: Weekday, row: number) {
    if (!selection || selection.day !== day) return false;
    const from = Math.min(selection.anchorRow, selection.hoverRow);
    const to = Math.max(selection.anchorRow, selection.hoverRow);
    return row >= from && row <= to;
  }

  function saveLabel() {
    if (!pending || !label.trim()) return;
    onAdd({ day: pending.day, startTime: pending.startTime, endTime: pending.endTime, label: label.trim() });
    setPending(null);
    setLabel("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <div className="grid min-w-[640px] grid-cols-[3.5rem_repeat(7,1fr)]">
          <div className="border-b border-r" />
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="border-b border-r p-2 text-center text-xs font-medium text-muted-foreground last:border-r-0"
            >
              {DAY_LABELS[day]}
            </div>
          ))}

          {HOURS.map((hour, row) => (
            <div key={hour} className="contents">
              <div className="border-r p-1 text-right text-[10px] text-muted-foreground">
                {hourToTime(hour)}
              </div>
              {WEEKDAYS.map((day) => {
                const existing = commitmentAt(day, hour);
                return (
                  <button
                    type="button"
                    key={`${day}-${hour}`}
                    onMouseDown={() => {
                      if (existing) return;
                      setSelection({ day, anchorRow: row, hoverRow: row });
                    }}
                    onMouseEnter={() =>
                      setSelection((sel) => (sel && sel.day === day ? { ...sel, hoverRow: row } : sel))
                    }
                    className={cn(
                      "h-7 border-r border-b last:border-r-0 transition-colors",
                      existing ? "bg-primary/20" : "hover:bg-muted/60",
                      isSelected(day, row) && "bg-primary/40"
                    )}
                    title={existing?.label}
                  >
                    {existing && row === 0 ? null : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {pending && (
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <span className="text-sm text-muted-foreground">
            {DAY_LABELS[pending.day]} {pending.startTime}–{pending.endTime}
          </span>
          <Input
            autoFocus
            placeholder="Label (e.g. Lecture, Work)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveLabel();
              if (e.key === "Escape") {
                setPending(null);
                setLabel("");
              }
            }}
          />
          <Button type="button" size="sm" onClick={saveLabel} disabled={!label.trim()}>
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setPending(null);
              setLabel("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {commitments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {commitments.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs"
            >
              {DAY_LABELS[c.day]} {c.startTime}–{c.endTime} · {c.label}
              <button
                type="button"
                onClick={() => onRemove(c.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${c.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
