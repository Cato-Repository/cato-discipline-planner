"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  return (
    <div className="flex flex-col gap-6">
      <AuthForm mode="login" onSuccess={() => router.push(redirectTo)} />
      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link
          href={`/signup${redirectTo !== "/home" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="underline underline-offset-2"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
