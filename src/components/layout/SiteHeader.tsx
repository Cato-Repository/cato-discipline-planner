"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

export function SiteHeader() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

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
    <header className="grid grid-cols-3 items-center border-b px-6 py-3">
      <div className="justify-self-start">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Cato
        </Link>
      </div>

      <div className="justify-self-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {pathname?.startsWith("/testing") && "Testing"}
      </div>

      <div className="flex items-center justify-self-end gap-3">
        {!loading &&
          (user ? (
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
          ))}
      </div>
    </header>
  );
}
