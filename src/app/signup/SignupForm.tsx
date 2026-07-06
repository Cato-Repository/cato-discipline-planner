"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  return (
    <div className="flex flex-col gap-6">
      <AuthForm mode="signup" onSuccess={() => router.push(redirectTo)} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${redirectTo !== "/home" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
