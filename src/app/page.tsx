import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarClock, Flame, ListChecks, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/get-current-user";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Priority-ranked task list",
    description:
      "Tell Cato what you study and what you need to get done. It ranks everything into Critical, High, Medium, and Low so you always know what matters right now.",
  },
  {
    icon: CalendarClock,
    title: "A timetable that respects your life",
    description:
      "Cato reads your existing commitments and slots your tasks into the free time that's actually left, instead of pretending your week is empty.",
  },
  {
    icon: Sparkles,
    title: "An LLM that actually decides",
    description:
      "Deterministic pre-processing keeps things cheap and consistent; the model makes the real call on priority and placement, only re-running when something changes.",
  },
  {
    icon: Flame,
    title: "Streaks & a discipline score",
    description:
      "Stay accountable with a running streak counter and a discipline score that tracks how consistently you follow through.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/tasks");

  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <div
          aria-hidden
          className="h-40 w-40 rounded-3xl bg-gradient-to-br from-orange-400 via-rose-400 to-sky-500 shadow-xl"
        />
        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Get Disciplined. Get Gota.
          </h1>
          <p className="text-lg text-muted-foreground">
            Turn a rough list of tasks, deadlines, and commitments into a prioritized,
            scheduled plan — so you always know what to work on next.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button render={<Link href="/onboarding" />} nativeButton={false} size="lg">
            Start
          </Button>
          <Button render={<Link href="#features" />} nativeButton={false} size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      <section id="features" className="border-t bg-muted/30 px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4 rounded-xl border bg-background p-6">
              <Icon className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div className="flex flex-col gap-1.5">
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
