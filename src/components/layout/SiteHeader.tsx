"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { useUser } from "@/lib/use-user";

export function SiteHeader() {
  const { user, loading } = useUser();

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
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
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
