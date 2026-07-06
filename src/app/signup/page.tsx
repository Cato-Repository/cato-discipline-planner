import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <Card className="gap-6 p-6">
        <h1 className="text-xl font-semibold">Sign up</h1>
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </Card>
    </div>
  );
}
