import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { sessionsApi, type QuestionOut, type ReviewItem } from "@/api/practice";
import { cn } from "@/lib/cn";
import { AIExplanationSidebar } from "./AIExplainationSidebar";
// ── Types ──────────────────────────────────────────────────────
type Phase = "loading" | "question" | "answered" | "completing" | "results";

interface SessionState {
  session_id: number;
  questions: QuestionOut[];
  currentIdx: number;
  answers: Record<number, string>; // question_id → given_answer
  feedbacks: Record<
    number,
    {
      // question_id → feedback after submit
      is_correct: boolean;
      correct_answer: string;
      explanation: string | null;
      xp_awarded: number;
    }
  >;
  totalXp: number;
  sessionXp: number;
}

const DIFFICULTY_COLOR = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  hard: "bg-danger/10 text-danger border-danger/20",
};

const XP_COLOR = { easy: 10, medium: 20, hard: 30 };

// ── MCQ Component ──────────────────────────────────────────────
function MCQRenderer({
  question,
  selected,
  onSelect,
  submitted,
  feedback,
}: {
  question: QuestionOut;
  selected: string;
  onSelect: (key: string) => void;
  submitted: boolean;
  feedback: SessionState["feedbacks"][number] | null;
}) {
  if (!question.options) return null;
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(question.options).map(([key, val]) => {
        const isSelected = selected === key;
        const correctKey = feedback
          ? Object.entries(question.options!).find(
              ([, v]) => v === feedback.correct_answer,
            )?.[0]
          : null;
        const isCorrectKey = submitted && key === correctKey;
        const isWrongKey = submitted && isSelected && key !== correctKey;

        return (
          <label
            key={key}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
              !submitted &&
                isSelected &&
                "border-primary bg-primary/5 ring-1 ring-primary",
              !submitted && !isSelected && "border-border hover:bg-background",
              isCorrectKey && "border-success bg-success/5 cursor-default",
              isWrongKey && "border-danger  bg-danger/5  cursor-default",
              submitted &&
                !isSelected &&
                key !== correctKey &&
                "border-border opacity-60 cursor-default",
            )}
          >
            <input
              type="radio"
              name="mcq"
              value={key}
              checked={isSelected}
              onChange={() => !submitted && onSelect(key)}
              disabled={submitted}
              className="accent-primary shrink-0"
            />
            <span className="flex-1 text-sm font-medium text-text-main">
              <span className="mr-2 font-bold text-text-muted">{key}.</span>
              {val}
            </span>
            {isCorrectKey && (
              <span className="material-symbols-outlined text-success icon-fill">
                check_circle
              </span>
            )}
            {isWrongKey && (
              <span className="material-symbols-outlined text-danger icon-fill">
                cancel
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}

// ── FIB Component ──────────────────────────────────────────────
function FIBRenderer({
  value,
  onChange,
  submitted,
  feedback,
}: {
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  feedback: SessionState["feedbacks"][number] | null;
}) {
  const isCorrect = feedback?.is_correct;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        Fill in the blank
      </p>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          disabled={submitted}
          className={cn(
            "h-12 w-full rounded-xl border px-4 text-text-main focus:outline-none focus:ring-2",
            !submitted &&
              "border-border bg-surface focus:border-primary focus:ring-primary/20",
            submitted && isCorrect && "border-success bg-success/5",
            submitted && !isCorrect && "border-danger bg-danger/5",
          )}
        />
        {submitted && (
          <span
            className={cn(
              "material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 icon-fill",
              isCorrect ? "text-success" : "text-danger",
            )}
          >
            {isCorrect ? "check_circle" : "cancel"}
          </span>
        )}
      </div>
      {submitted && !isCorrect && feedback && (
        <p className="text-sm font-semibold text-success">
          Correct answer:{" "}
          <span className="underline">{feedback.correct_answer}</span>
        </p>
      )}
    </div>
  );
}

// ── Short Component ────────────────────────────────────────────
function ShortRenderer({
  value,
  onChange,
  submitted,
  feedback,
}: {
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  feedback: SessionState["feedbacks"][number] | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        Short answer
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here..."
        disabled={submitted}
        rows={4}
        className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {submitted && feedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Model Answer
          </p>
          <p className="mt-1 text-sm text-text-main">
            {feedback.correct_answer}
          </p>
        </div>
      )}
    </div>
  );
}

// ── XP Flash ──────────────────────────────────────────────────
function XpFlash({ xp, show }: { xp: number; show: boolean }) {
  if (!show || xp === 0) return null;
  return (
    <div
      className={cn(
        "fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 shadow-lg transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
      )}
    >
      <span className="material-symbols-outlined text-warning icon-fill">
        stars
      </span>
      <span className="font-black text-warning">+{xp} XP</span>
    </div>
  );
}

// ── Results Screen ─────────────────────────────────────────────
function ResultsScreen({
  items,
  sessionXp,
  totalXp,
  level,
  levelledUp,
  recommendation,
  subjectId,
  chapterId,
}: {
  items: ReviewItem[];
  sessionXp: number;
  totalXp: number;
  level: number;
  levelledUp: boolean;
  recommendation: string | null;
  subjectId: string | null;
  chapterId: string | null;
}) {
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(false);
  const correct = items.filter((i) => i.is_correct).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const tier =
    pct >= 80
      ? {
          icon: "emoji_events",
          color: "text-warning",
          bg: "bg-warning/10",
          msg: "Excellent! 🎉",
        }
      : pct >= 60
        ? {
            icon: "thumb_up",
            color: "text-success",
            bg: "bg-success/10",
            msg: "Good effort! 💪",
          }
        : {
            icon: "sentiment_dissatisfied",
            color: "text-danger",
            bg: "bg-danger/10",
            msg: "Keep practising! 📚",
          };

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-8">
      {/* Level up banner */}
      {levelledUp && (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <span className="material-symbols-outlined text-3xl text-warning icon-fill">
            military_tech
          </span>
          <div>
            <p className="font-black text-warning">
              Level up! You're now Level {level}!
            </p>
            <p className="text-sm text-text-muted">
              Keep going to reach the next level.
            </p>
          </div>
        </div>
      )}

      {/* Score card */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-full",
            tier.bg,
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-5xl icon-fill",
              tier.color,
            )}
          >
            {tier.icon}
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-black text-text-main">{pct}%</h1>
          <p className="mt-1 text-text-muted">
            {correct} of {total} correct
          </p>
          <p className="mt-2 font-semibold text-text-main">{tier.msg}</p>
        </div>

        {/* Score bar */}
        <div className="w-full">
          <div className="h-3 overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                pct >= 70
                  ? "bg-success"
                  : pct >= 40
                    ? "bg-warning"
                    : "bg-danger",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            <span>0%</span>
            <span className="text-warning">60% pass mark</span>
            <span>100%</span>
          </div>
        </div>

        {/* XP earned */}
        <div className="grid w-full grid-cols-3 gap-3 rounded-xl bg-background p-4">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-warning icon-fill">
              stars
            </span>
            <p className="text-lg font-black text-warning">+{sessionXp}</p>
            <p className="text-xs text-text-muted">XP earned</p>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-border">
            <span className="material-symbols-outlined text-primary icon-fill">
              bar_chart
            </span>
            <p className="text-lg font-black text-text-main">{totalXp}</p>
            <p className="text-xs text-text-muted">Total XP</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-purple-500 icon-fill">
              military_tech
            </span>
            <p className="text-lg font-black text-text-main">Lvl {level}</p>
            <p className="text-xs text-text-muted">Current level</p>
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="w-full rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-primary shrink-0">
                lightbulb
              </span>
              <p className="text-sm text-text-main">{recommendation}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => setShowReview(!showReview)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-text-main transition-colors hover:bg-border/40"
          >
            <span className="material-symbols-outlined text-[18px]">
              rate_review
            </span>
            {showReview ? "Hide" : "Review"} all questions
          </button>
          <button
            onClick={() =>
              navigate(`/practice?chapter=${chapterId}&subject=${subjectId}`)
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-[18px]">
              replay
            </span>
            Practice again
          </button>
          <button
            onClick={() =>
              navigate(subjectId ? `/subjects/${subjectId}` : "/subjects")
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to chapters
          </button>
        </div>
      </div>

      {/* Review cards */}
      {showReview && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-text-main">Question review</h2>
          {items.map((item, i) => (
            <div
              key={item.question_id}
              className={cn(
                "rounded-2xl border p-5",
                item.is_correct
                  ? "border-success/30 bg-success/5"
                  : "border-danger/30 bg-danger/5",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Q{i + 1} · {item.difficulty}
                </span>
                <div className="flex items-center gap-1">
                  {item.is_correct ? (
                    <span className="material-symbols-outlined text-success icon-fill">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-danger icon-fill">
                      cancel
                    </span>
                  )}
                  {item.xp_awarded > 0 && (
                    <span className="text-xs font-bold text-warning">
                      +{item.xp_awarded} XP
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-3 font-medium text-text-main">
                {item.question_text}
              </p>

              {/* Options for MCQ */}
              {item.question_type === "mcq" && item.options && (
                <div className="mb-3 flex flex-col gap-1.5">
                  {Object.entries(item.options).map(([key, val]) => {
                    const isCorrect = val === item.correct_answer;
                    const isGiven = item.given_answer?.toUpperCase() === key;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                          isCorrect &&
                            "bg-success/10 font-semibold text-success",
                          isGiven &&
                            !isCorrect &&
                            "bg-danger/10 font-semibold text-danger",
                          !isCorrect && !isGiven && "text-text-muted",
                        )}
                      >
                        <span className="font-bold">{key}.</span> {val}
                        {isCorrect && (
                          <span className="material-symbols-outlined ml-auto text-sm icon-fill text-success">
                            check_circle
                          </span>
                        )}
                        {isGiven && !isCorrect && (
                          <span className="material-symbols-outlined ml-auto text-sm icon-fill text-danger">
                            cancel
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* For FIB / Short */}
              {item.question_type !== "mcq" && (
                <div className="mb-3 flex flex-col gap-1 text-sm">
                  <p className="text-text-muted">
                    Your answer:{" "}
                    <span className="font-semibold text-text-main">
                      {item.given_answer || "—"}
                    </span>
                  </p>
                  {!item.is_correct && (
                    <p className="text-text-muted">
                      Correct:{" "}
                      <span className="font-semibold text-success">
                        {item.correct_answer}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get("chapter");
  const subjectId = searchParams.get("subject");

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [xpFlash, setXpFlash] = useState({ show: false, xp: 0 });

  const [session, setSession] = useState<SessionState | null>(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results state
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [completeData, setCompleteData] = useState<{
    sessionXp: number;
    totalXp: number;
    level: number;
    levelledUp: boolean;
    recommendation: string | null;
  } | null>(null);

  const startTime = useRef<number>(Date.now());

  // ── Start session on mount ────────────────────────────────────
  useEffect(() => {
    if (!chapterId) {
      navigate("/subjects");
      return;
    }
    sessionsApi
      .start(Number(chapterId))
      .then((data) => {
        setSession({
          session_id: data.session_id,
          questions: data.questions,
          currentIdx: 0,
          answers: {},
          feedbacks: {},
          totalXp: 0,
          sessionXp: 0,
        });
        setPhase("question");
        startTime.current = Date.now();
      })
      .catch(() =>
        setError("Could not start session. Is the backend running?"),
      );
  }, [chapterId]);

  const currentQ = session?.questions[session.currentIdx];
  const progress = session
    ? Math.round((session.currentIdx / session.questions.length) * 100)
    : 0;

  // ── Submit answer ─────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!session || !currentQ || isSubmitting) return;
    if (!answer.trim() && currentQ.question_type !== "short") return;

    setIsSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);

    try {
      const fb = await sessionsApi.answer(
        session.session_id,
        currentQ.question_id,
        answer,
        timeTaken,
      );

      setSession((prev) =>
        prev
          ? {
              ...prev,
              answers: { ...prev.answers, [currentQ.question_id]: answer },
              feedbacks: { ...prev.feedbacks, [currentQ.question_id]: fb },
              sessionXp: prev.sessionXp + fb.xp_awarded,
            }
          : prev,
      );

      if (fb.xp_awarded > 0) {
        setXpFlash({ show: true, xp: fb.xp_awarded });
        setTimeout(() => setXpFlash({ show: false, xp: 0 }), 1800);
      }

      setPhase("answered");
    } catch {
      setError("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [session, currentQ, answer, isSubmitting]);

  // ── Next question or complete ─────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!session) return;

    const isLast = session.currentIdx >= session.questions.length - 1;

    if (isLast) {
      setPhase("completing");
      try {
        const [complete, review] = await Promise.all([
          sessionsApi.complete(session.session_id),
          sessionsApi.review(session.session_id),
        ]);
        setCompleteData({
          sessionXp: complete.xp_earned,
          totalXp: complete.total_xp,
          level: complete.level,
          levelledUp: complete.levelled_up,
          recommendation: review.recommendation,
        });
        setReviewItems(review.items);
        setPhase("results");
      } catch {
        setError("Failed to save results. Please try again.");
        setPhase("answered");
      }
      return;
    }

    setSession((prev) =>
      prev ? { ...prev, currentIdx: prev.currentIdx + 1 } : prev,
    );
    setAnswer("");
    setPhase("question");
    startTime.current = Date.now();
  }, [session]);

  // ── Skip ──────────────────────────────────────────────────────
  const handleSkip = useCallback(async () => {
    if (!session || !currentQ) return;
    // Submit empty answer to record skip
    if (currentQ.question_type !== "short") {
      await sessionsApi
        .answer(session.session_id, currentQ.question_id, "", 0)
        .catch(() => {});
    }
    handleNext();
  }, [session, currentQ, handleNext]);

  const handleSkipWithoutNext = async () => {
    if (!session || !currentQ) return;

    // record skip in backend
    let fb = null;

    if (currentQ.question_type !== "short") {
      try {
        fb = await sessionsApi.answer(
          session.session_id,
          currentQ.question_id,
          "",
          0,
        );
      } catch {
        /* empty */
      }
    }

    // mark as answered locally so UI unlocks explanation
    setSession((prev) =>
      prev
        ? {
            ...prev,
            answers: {
              ...prev.answers,
              [currentQ.question_id]: "",
            },
            feedbacks: {
              ...prev.feedbacks,
              [currentQ.question_id]: fb || {
                is_correct: false,
                correct_answer: "", // fallback but usually fb exists
                explanation: null,
                xp_awarded: 0,
              },
            },
          }
        : prev,
    );

    setPhase("answered"); // 👈 IMPORTANT
  };
  // ── Loading ───────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">
            progress_activity
          </span>
          <p className="text-text-muted">Preparing your adaptive session...</p>
        </div>
      </div>
    );
  }

  if (phase === "completing") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">
            progress_activity
          </span>
          <p className="font-semibold text-text-main">Saving your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-danger">
            error
          </span>
          <p className="font-semibold text-text-main">{error}</p>
          <button
            onClick={() =>
              navigate(subjectId ? `/subjects/${subjectId}` : "/subjects")
            }
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-bold text-text-main hover:bg-border/40"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────
  if (phase === "results" && completeData) {
    return (
      <ResultsScreen
        items={reviewItems}
        sessionXp={completeData.sessionXp}
        totalXp={completeData.totalXp}
        level={completeData.level}
        levelledUp={completeData.levelledUp}
        recommendation={completeData.recommendation}
        subjectId={subjectId}
        chapterId={chapterId}
      />
    );
  }

  if (!session || !currentQ) return null;

  const feedback = session.feedbacks[currentQ.question_id] ?? null;
  const submitted = phase === "answered";

  // ── Question view ─────────────────────────────────────────────
  return (
    <>
      <XpFlash xp={xpFlash.xp} show={xpFlash.show} />

      <div className="mx-auto flex max-w-[800px] flex-col gap-6 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link
              to={subjectId ? `/subjects/${subjectId}` : "/subjects"}
              className="hover:text-primary transition-colors"
            >
              Chapters
            </Link>
            <span className="material-symbols-outlined text-xs">
              chevron_right
            </span>
            <span className="font-semibold text-primary capitalize">
              Practice
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
              <span className="material-symbols-outlined text-sm icon-fill">
                stars
              </span>
              {session.sessionXp} XP
            </span>
            <button
              onClick={() =>
                navigate(subjectId ? `/subjects/${subjectId}` : "/subjects")
              }
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-text-muted hover:bg-border/40 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-text-muted">
              Question {session.currentIdx + 1} of {session.questions.length}
            </span>
            <span className="text-primary">{progress}% complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                DIFFICULTY_COLOR[currentQ.difficulty],
              )}
            >
              {currentQ.difficulty}
            </span>
            <span className="rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              {currentQ.question_type === "mcq"
                ? "Multiple choice"
                : currentQ.question_type === "fib"
                  ? "Fill in the blank"
                  : "Short answer"}
            </span>
            <span className="ml-auto text-xs font-bold text-warning">
              +{XP_COLOR[currentQ.difficulty]} XP if correct
            </span>
          </div>
          {/* Question text */}
          <h2 className="text-xl font-bold leading-relaxed text-text-main md:text-2xl">
            {currentQ.question_text}
          </h2>
          {/* Answer input by type */}
          {currentQ.question_type === "mcq" && (
            <MCQRenderer
              question={currentQ}
              selected={answer}
              onSelect={setAnswer}
              submitted={submitted}
              feedback={feedback}
            />
          )}
          {currentQ.question_type === "fib" && (
            <FIBRenderer
              value={answer}
              onChange={setAnswer}
              submitted={submitted}
              feedback={feedback}
            />
          )}
          {currentQ.question_type === "short" && (
            <ShortRenderer
              value={answer}
              onChange={setAnswer}
              submitted={submitted}
              feedback={feedback}
            />
          )}
          {/* AI explanation after submit */}
          {/* {submitted && feedback?.explanation && (
            <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <span className="material-symbols-outlined shrink-0 text-primary">
                auto_awesome
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  AI Explanation
                </p>
                <p className="mt-1 text-sm text-text-main">
                  {feedback.explanation}
                </p>
              </div>
            </div>
          )} */}
          {/* Action buttons */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={handleSkip}
              disabled={submitted}
              className="text-sm font-medium text-text-muted hover:text-text-main disabled:opacity-0 transition-colors"
            >
              Skip
            </button>

            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (currentQ.question_type !== "short" && !answer.trim())
                }
                className="flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">
                      progress_activity
                    </span>{" "}
                    Checking...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-hover"
              >
                {session.currentIdx >= session.questions.length - 1
                  ? "See Results"
                  : "Next Question"}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            )}
            <AIExplanationSidebar
              question={currentQ}
              sessionId={session.session_id}
              isAnswered={submitted}
              givenAnswer={session.answers[currentQ.question_id] || ""}
              correctAnswer={feedback?.correct_answer ?? ""}
              onSkip={handleSkipWithoutNext}
            />
          </div>
        </div>
      </div>
    </>
  );
}
