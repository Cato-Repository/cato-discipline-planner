"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudyPlan } from "@/lib/types";
import { useUser } from "@/lib/use-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { EMPTY_PLAN, fetchStudyPlan, syncStudyPlan } from "@/lib/study-plan-data";

/**
 * Study plan state, backed by Supabase (tasks, timetable_commitments,
 * suggested_slots, and the users row) and scoped to the logged-in user.
 * Anonymous visitors (mid-onboarding, before the auth gate) see EMPTY_PLAN
 * and updates are a no-op until they're authenticated.
 */
export function useStudyPlan() {
  const { user, loading: userLoading } = useUser();
  const [planState, setPlanState] = useState<StudyPlan>(EMPTY_PLAN);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const planRef = useRef(planState);

  useEffect(() => {
    planRef.current = planState;
  }, [planState]);

  useEffect(() => {
    if (!user) return;
    if (loadedUserId === user.id) return;

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    fetchStudyPlan(supabase, user.id).then((fetched) => {
      if (cancelled) return;
      setPlanState(fetched);
      setLoadedUserId(user.id);
    });

    return () => {
      cancelled = true;
    };
  }, [user, loadedUserId]);

  const updatePlan = useCallback(
    (updater: (prev: StudyPlan) => StudyPlan) => {
      const prev = planRef.current;
      const next = updater(prev);
      setPlanState(next);

      if (user) {
        const supabase = getSupabaseBrowserClient();
        syncStudyPlan(supabase, user.id, prev, next).catch((error) => {
          console.error("Failed to sync study plan to Supabase", error);
        });
      }
    },
    [user]
  );

  const plan = user ? planState : EMPTY_PLAN;
  const hydrated = !userLoading && (!user || loadedUserId === user.id);

  return { plan, updatePlan, hydrated };
}
