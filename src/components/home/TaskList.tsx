"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

interface TaskDraft {
  title: string;
  deadline: string;
}

interface TaskListProps {
  tasks: Task[];
  onChangeTier: (taskId: string, tier: PriorityTier) => void;
  onToggleStatus: (taskId: string) => void;
  onAddTask: (input: TaskDraft) => void;
  onEditTask: (taskId: string, input: TaskDraft) => void;
  onDeleteTask: (taskId: string) => void;
}

/** ISO 8601 -> the local "YYYY-MM-DDTHH:mm" shape <input type="datetime-local"> expects. */
function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TaskList({
  tasks,
  onChangeTier,
  onToggleStatus,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: TaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  const pending = tasks.filter((t) => t.status === "pending");
  const done = tasks.filter((t) => t.status === "done");
  const unranked = pending.filter((t) => !t.priorityTier);

  function submitNewTask() {
    const title = newTitle.trim();
    if (!title || !newDeadline) return;
    onAddTask({ title, deadline: new Date(newDeadline).toISOString() });
    setNewTitle("");
    setNewDeadline("");
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDeadline(toDatetimeLocalValue(task.deadline));
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function saveEditing(taskId: string) {
    const title = editTitle.trim();
    if (!title || !editDeadline) return;
    onEditTask(taskId, { title, deadline: new Date(editDeadline).toISOString() });
    setEditingId(null);
  }

  function confirmDelete(task: Task) {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDeleteTask(task.id);
    }
  }

  function renderTask(task: Task, tier: PriorityTier | null) {
    if (editingId === task.id) {
      return (
        <Card key={task.id} className="flex-col gap-2 border p-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            aria-label="Task title"
          />
          <Input
            type="datetime-local"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            aria-label="Task deadline"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => saveEditing(task.id)}>
              Save
            </Button>
          </div>
        </Card>
      );
    }

    const colors = tier ? PRIORITY_TIER_COLORS[tier] : undefined;

    return (
      <Card
        key={task.id}
        className={cn("flex-row items-center justify-between gap-3 border p-3", colors?.border)}
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
              Due {formatDeadline(task.deadline)}
              {task.pinned && " · pinned"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Select
            value={tier ?? undefined}
            onValueChange={(value) => onChangeTier(task.id, value as PriorityTier)}
          >
            <SelectTrigger size="sm" className="w-[110px]" aria-label={`Edit priority for ${task.title}`}>
              <SelectValue placeholder="Set priority" />
            </SelectTrigger>
            <SelectContent>
              {TIER_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  {PRIORITY_TIER_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${task.title}`}
            onClick={() => startEditing(task)}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${task.title}`}
            onClick={() => confirmDelete(task)}
          >
            <Trash2 />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex-row items-center gap-2 p-3">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task title"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitNewTask();
            }
          }}
        />
        <Input
          type="datetime-local"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
          aria-label="New task deadline"
          className="w-[190px] shrink-0"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Add task"
          disabled={!newTitle.trim() || !newDeadline}
          onClick={submitNewTask}
        >
          <Plus />
        </Button>
      </Card>

      {unranked.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <h2 className="text-sm font-semibold">Unsorted</h2>
            <span className="text-xs text-muted-foreground">Building your prioritized plan…</span>
          </div>
          <div className="flex flex-col gap-2">{unranked.map((task) => renderTask(task, null))}</div>
        </div>
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
              {tierTasks.map((task) => renderTask(task, tier))}
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
                <span className="flex-1 text-sm line-through">{task.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => confirmDelete(task)}
                >
                  <X />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No tasks yet — add one above to get started.</p>
      )}
    </div>
  );
}
