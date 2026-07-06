"use client";

import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthSnapshot {
  user: User | null;
  loading: boolean;
}

let snapshot: AuthSnapshot = { user: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  const supabase = getSupabaseBrowserClient();

  supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
    snapshot = { user: data.user, loading: false };
    notify();
  });

  supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    snapshot = { user: session?.user ?? null, loading: false };
    notify();
  });
}

function subscribe(listener: () => void) {
  ensureInitialized();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AuthSnapshot {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return { user: null, loading: true };
}

/** Current authenticated user, kept in sync with Supabase Auth state. */
export function useUser(): AuthSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
