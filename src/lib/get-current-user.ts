import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Server-side: the currently authenticated user, or null. */
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
