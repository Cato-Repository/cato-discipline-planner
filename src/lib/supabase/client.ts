import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./config";

/** Returns null until real Supabase env vars are set (see .env.example). */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
