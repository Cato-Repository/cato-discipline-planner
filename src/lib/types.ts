export type SubjectField = "computer-science" | "social-science-humanities" | "arts" | "other";

export type TaskCategory = "lecture" | "coding-project" | "problem-set" | "other";

export type TaskSource = "user-added" | "suggested";

export type PriorityTier = "critical" | "high" | "medium" | "low";

export type TaskStatus = "pending" | "done";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  deadline: string; // ISO 8601
  status: TaskStatus;
  source: TaskSource;
  priorityTier: PriorityTier | null;
  /** true once the user manually overrides the tier via the Edit control */
  pinned: boolean;
}

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface TimetableCommitment {
  id: string;
  day: Weekday;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  label: string;
}

export interface SuggestedSlot {
  taskId: string;
  day: Weekday;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface OnboardingProfile {
  subject: SubjectField | null;
  tasks: Task[];
}

export interface StudyPlan {
  subject: SubjectField | null;
  tasks: Task[];
  commitments: TimetableCommitment[];
  suggestedSlots: SuggestedSlot[];
  streakCount: number;
  disciplineScore: number;
  lastActiveDate: string | null;
  /** Signature of the inputs last sent to /api/prioritize, so it's only re-run on change. */
  lastPrioritizedSignature: string | null;
}

export const PRIORITY_TIER_LABELS: Record<PriorityTier, string> = {
  critical: "Critical",
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

export const PRIORITY_TIER_COLORS: Record<PriorityTier, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400", border: "border-red-500/30" },
  high: { bg: "bg-orange-500/15", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30" },
  medium: { bg: "bg-sky-500/15", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/30" },
  low: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30" },
};
