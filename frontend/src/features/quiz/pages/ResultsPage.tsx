import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

// Results are passed via router state from QuizPage when it navigates here.
// Shape: { correct: number, total: number, chapterId: string, subjectId: string }
interface ResultState {
  correct: number;
  total: number;
  subjectId?: string;
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { chapterId } = useParams<{ chapterId: string }>();
  const location = useLocation();

  // If navigated from QuizPage with state, use it; otherwise show generic
  const state = location.state as ResultState | null;
  const correct = state?.correct ?? 0;
  const total = state?.total ?? 0;
  const subjectId = state?.subjectId ?? "";
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const passed = pct >= 60;

  const tiers = [
    {
      min: 80,
      icon: "emoji_events",
      color: "text-warning",
      msg: "Excellent work! 🎉",
    },
    {
      min: 60,
      icon: "thumb_up",
      color: "text-success",
      msg: "Good effort! Keep going 💪",
    },
    {
      min: 0,
      icon: "sentiment_dissatisfied",
      color: "text-danger",
      msg: "Keep practising — you'll get there! 📚",
    },
  ];
  const tier = tiers.find((t) => pct >= t.min) ?? tiers[2];

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-border bg-surface p-10 shadow-lg">
        <div
          className={cn(
            "flex size-24 items-center justify-center rounded-full",
            passed ? "bg-success/10" : "bg-danger/10",
          )}
        >
          <span
            className={cn("material-symbols-outlined text-5xl", tier.color)}
          >
            {tier.icon}
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-black text-text-main">{pct}%</h1>
          <p className="mt-1 text-lg text-text-muted">
            {correct} of {total} correct
          </p>
          <p className="mt-3 font-semibold text-text-main">{tier.msg}</p>
        </div>

        {/* Mini stat bar */}
        <div className="w-full">
          <div className="mb-2 flex justify-between text-xs font-medium text-text-muted">
            <span>Score</span>
            <span>{pct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                passed ? "bg-success" : "bg-danger",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-text-muted">
            <span>0%</span>
            <span className="text-warning">60% pass</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          {subjectId && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/subjects/${subjectId}`)}
            >
              Back to Chapters
            </Button>
          )}
          <Button
            className="w-full"
            onClick={() =>
              navigate(`/quiz/${chapterId}`, {
                state: null,
                replace: true,
              })
            }
          >
            <span className="material-symbols-outlined text-sm">replay</span>
            Retry Chapter
          </Button>
          <Button
            variant="ghost"
            className="w-full text-text-muted"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
