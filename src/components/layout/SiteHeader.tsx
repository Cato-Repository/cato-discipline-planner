"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

export function SiteHeader() {
  const { user, loading } = useUser();
  const router = useRouter();

  async function handleSignOut() {
    // Sign out via the browser client (not a server action) so
    // onAuthStateChange fires and useUser() updates immediately --
    // a server-side signOut clears the cookie but never notifies the
    // client-side session listener.
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        Cato
      </Link>

      {!loading && (
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
              Log in
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
