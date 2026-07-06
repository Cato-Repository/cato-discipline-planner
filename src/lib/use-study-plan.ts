"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { StudyPlan } from "@/lib/types";

const STORAGE_KEY = "cato:plan";

/**
 * Pre-MVP client-side persistence for the study plan (onboarding answers,
 * timetable, prioritized tasks). There's no auth/login flow yet, so state
 * lives in localStorage rather than a real per-user Supabase row -- swap this
 * out for a server-backed store once accounts exist.
 */
export const EMPTY_PLAN: StudyPlan = {
  subject: null,
  tasks: [],
  commitments: [],
  suggestedSlots: [],
  streakCount: 0,
  disciplineScore: 50,
  lastActiveDate: null,
  lastPrioritizedSignature: null,
};

let cachedPlan: StudyPlan | null = null;
const listeners = new Set<() => void>();

function readPlan(): StudyPlan {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PLAN;
    return { ...EMPTY_PLAN, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PLAN;
  }
}

function getSnapshot(): StudyPlan {
  if (cachedPlan === null) cachedPlan = readPlan();
  return cachedPlan;
}

function getServerSnapshot(): StudyPlan {
  return EMPTY_PLAN;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writePlan(next: StudyPlan) {
  cachedPlan = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

// Standard useSyncExternalStore trick for "has this mounted on the client yet",
// without calling setState from an effect.
function subscribeNoop() {
  return () => {};
}
function getIsClient() {
  return true;
}
function getIsClientServer() {
  return false;
}

export function useStudyPlan() {
  const plan = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribeNoop, getIsClient, getIsClientServer);

  const updatePlan = useCallback((updater: (prev: StudyPlan) => StudyPlan) => {
    writePlan(updater(cachedPlan ?? EMPTY_PLAN));
  }, []);

  return { plan, updatePlan, hydrated };
}
