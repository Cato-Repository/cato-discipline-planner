"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { resolvePostAuthDestination } from "@/lib/post-auth-destination";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  async function handleSuccess() {
    router.push(await resolvePostAuthDestination(redirectParam));
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthForm mode="signup" onSuccess={handleSuccess} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
          className="underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
