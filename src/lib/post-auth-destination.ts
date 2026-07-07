import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasStudyPlanData } from "@/lib/study-plan-data";

/**
 * Where to send someone right after logging in or signing up on the
 * standalone /login or /signup pages. An explicit `redirect` param (set when
 * a gated page like /tasks or /timetable sent them here) always wins --
 * otherwise, new/incomplete accounts go to onboarding and everyone else goes
 * straight to their tasks.
 */
export async function resolvePostAuthDestination(redirectParam: string | null): Promise<string> {
  if (redirectParam) return redirectParam;

  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasData = user ? await hasStudyPlanData(supabase, user.id) : false;
  return hasData ? "/tasks" : "/onboarding";
}
