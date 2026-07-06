import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StreakPanelProps {
  streakCount: number;
  disciplineScore: number;
}

export function StreakPanel({ streakCount, disciplineScore }: StreakPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-2 p-6 text-center">
        <Flame className="h-8 w-8 text-orange-500" />
        <p className="text-2xl font-semibold">{streakCount} day{streakCount === 1 ? "" : "s"}</p>
        <p className="text-sm text-muted-foreground">
          {streakCount > 0 ? "Keep it going — don't break the chain." : "Complete a task today to start your streak."}
        </p>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-rose-400 to-sky-500 text-sm font-semibold text-white"
          >
            You
          </div>
          <div>
            <p className="text-sm font-medium">Discipline score</p>
            <p className="text-2xl font-semibold">{disciplineScore}/100</p>
          </div>
        </div>
        <Progress value={disciplineScore} />
      </Card>
    </div>
  );
}
