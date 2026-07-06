import type { SubjectField, TaskCategory } from "./types";

/**
 * Pre-MVP task suggestion logic (open question #2 in the product doc): a static
 * rule set per subject rather than an LLM call, so onboarding stays fast and free.
 * Revisit once there's real usage data to justify a smarter (LLM-driven) suggester.
 */
export const SUGGESTED_TASKS_BY_SUBJECT: Record<SubjectField, { title: string; category: TaskCategory }[]> = {
  "computer-science": [
    { title: "Finish this week's lecture notes", category: "lecture" },
    { title: "Push progress on your coding project", category: "coding-project" },
    { title: "Work through the current problem set", category: "problem-set" },
  ],
  "social-science-humanities": [
    { title: "Finish assigned readings", category: "lecture" },
    { title: "Draft essay outline", category: "other" },
    { title: "Review lecture notes", category: "lecture" },
  ],
  arts: [
    { title: "Continue studio/project work", category: "coding-project" },
    { title: "Review critique feedback", category: "other" },
    { title: "Finish this week's lecture notes", category: "lecture" },
  ],
  other: [
    { title: "Finish this week's lecture notes", category: "lecture" },
    { title: "Work through current assignment", category: "problem-set" },
  ],
};

export function getSuggestedTasks(subject: SubjectField | null) {
  if (!subject) return [];
  return SUGGESTED_TASKS_BY_SUBJECT[subject];
}
