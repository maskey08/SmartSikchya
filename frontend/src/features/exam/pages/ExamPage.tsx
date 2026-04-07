/**
 * ExamPage — "Test Yourself" subject-wide timed examination.
 *
 * HOW this differs from PracticePage:
 *  PracticePage:  Chapter-level | Immediate feedback per question | No timer | Adaptive difficulty
 *  ExamPage:      Subject-level | Feedback only at end           | Countdown | All difficulties mixed
 *
 * WHY submit all at once vs one-by-one?
 * In a real exam, you don't see "correct/wrong" after each question.
 * Submitting all at once also means the user can CHANGE answers before
 * submitting — a key exam behaviour. The backend endpoint accepts an
 * array of {question_id, given_answer} and grades everything together.
 *
 * WHY a question navigator sidebar?
 * Exam UX standard (think Moodle, JEE). It shows:
 *   - Which questions are answered (filled)
 *   - Which are unanswered (empty)
 *   - Lets students jump around non-linearly
 * This mirrors real exam conditions.
 *
 * WHY keep the timer in frontend only (not validated by backend)?
 * For MVP, the backend records when the session started. A future
 * enhancement would reject submissions past the time limit.
 * For now, the timer is a UI discipline tool, not a security mechanism.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { cn } from "@/lib/cn";
import type { Subject } from "@/types";

// ── Types ──────────────────────────────────────────────────────
interface QuestionOut {
  question_id: number;
  question_text: string;
  question_type: "mcq" | "fib" | "short";
  options: Record<string, string> | null;
  difficulty: "easy" | "medium" | "hard";
}
interface StartExamOut {
  session_id: number;
  subject_name: string;
  questions: QuestionOut[];
  total_questions: number;
  time_limit_mins: number;
}
interface SubmitResult {
  session_id: number;
  total_questions: number;
  correct_count: number;
  accuracy_pct: number;
  xp_earned: number;
  total_xp: number;
  level: number;
  levelled_up: boolean;
  chapter_breakdown: {
    chapter_name: string;
    correct: number;
    total: number;
    accuracy_pct: number;
  }[];
  items: {
    question_id: number;
    question_text: string;
    question_type: string;
    options: Record<string, string> | null;
    given_answer: string;
    correct_answer: string | null;
    is_correct: boolean;
    difficulty: string;
    xp_awarded: number;
  }[];
}

type Phase = "subject-picker" | "exam" | "submitting" | "results";

// ── Timer hook ─────────────────────────────────────────────────
// WHY a custom hook instead of inline useEffect?
// The timer logic (start, tick, stop on cleanup) is self-contained.
// Extracting it makes ExamPage cleaner and lets us add pause/resume later.
function useCountdown(totalSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const callbackRef = useRef(onExpire);
  callbackRef.current = onExpire;

  useEffect(() => {
    if (totalSeconds === 0) return;
    setRemaining(totalSeconds);
    const tick = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          callbackRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // Cleanup: clear interval when component unmounts or totalSeconds changes
    return () => clearInterval(tick);
  }, [totalSeconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining < 120; // last 2 minutes — show red warning
  return { mins, secs, remaining, isLow };
}

// ── Question navigator sidebar ─────────────────────────────────
function QuestionNavigator({
  questions,
  answers,
  current,
  onJump,
}: {
  questions: QuestionOut[];
  answers: Record<number, string>;
  current: number;
  onJump: (idx: number) => void;
}) {
  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-surface lg:flex">
      <div className="border-b border-border px-4 py-3">
        <p className="font-bold text-text-main text-sm">Question Navigator</p>
        <p className="text-xs text-text-muted mt-0.5">
          {Object.keys(answers).length}/{questions.length} answered
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, i) => {
            const answered = !!answers[q.question_id]?.trim();
            const isCurrent = i === current;
            return (
              <button
                key={q.question_id}
                onClick={() => onJump(i)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all",
                  isCurrent && "bg-primary text-white shadow-md",
                  !isCurrent &&
                    answered &&
                    "bg-primary/15 text-primary border border-primary/30",
                  !isCurrent &&
                    !answered &&
                    "border border-border text-text-muted hover:bg-background",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="border-t border-border p-3 space-y-1.5">
        {[
          { color: "bg-primary", label: "Current" },
          {
            color: "bg-primary/15 border border-primary/30",
            label: "Answered",
          },
          { color: "border border-border", label: "Not answered" },
        ].map(({ color, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-xs text-text-muted"
          >
            <div className={cn("size-3 rounded", color)} />
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Results screen ─────────────────────────────────────────────
function ExamResults({
  result,
  onRetry,
  onDashboard,
}: {
  result: SubmitResult;
  onRetry: () => void;
  onDashboard: () => void;
}) {
  const [showReview, setShowReview] = useState(false);
  const pct = result.accuracy_pct;

  const tier =
    pct >= 80
      ? {
          icon: "emoji_events",
          color: "text-warning",
          bg: "bg-warning/10",
          msg: "Outstanding! 🎉",
        }
      : pct >= 60
        ? {
            icon: "thumb_up",
            color: "text-success",
            bg: "bg-success/10",
            msg: "Good work! 💪",
          }
        : pct >= 40
          ? {
              icon: "sentiment_neutral",
              color: "text-warning",
              bg: "bg-warning/10",
              msg: "Keep practising 📚",
            }
          : {
              icon: "sentiment_dissatisfied",
              color: "text-danger",
              bg: "bg-danger/10",
              msg: "More revision needed 📖",
            };

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-8">
      {result.levelled_up && (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <span className="material-symbols-outlined text-3xl text-warning icon-fill">
            military_tech
          </span>
          <div>
            <p className="font-black text-warning">
              Level up! You're now Level {result.level}!
            </p>
            <p className="text-sm text-text-muted">
              Your hard work is paying off.
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
            {result.correct_count} of {result.total_questions} correct
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
            <span className="text-warning">60% pass</span>
            <span>100%</span>
          </div>
        </div>

        {/* XP earned */}
        <div className="grid w-full grid-cols-3 gap-3 rounded-xl bg-background p-4">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-warning icon-fill">
              stars
            </span>
            <p className="text-lg font-black text-warning">
              +{result.xp_earned}
            </p>
            <p className="text-xs text-text-muted">XP earned</p>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-border">
            <span className="material-symbols-outlined text-primary icon-fill">
              bar_chart
            </span>
            <p className="text-lg font-black text-text-main">
              {result.total_xp}
            </p>
            <p className="text-xs text-text-muted">Total XP</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-purple-500 icon-fill">
              military_tech
            </span>
            <p className="text-lg font-black text-text-main">
              Lv {result.level}
            </p>
            <p className="text-xs text-text-muted">Level</p>
          </div>
        </div>

        {/* Per-chapter breakdown — unique to exam results */}
        {/* WHY show chapter breakdown here?
            The whole point of the exam was to test ACROSS chapters.
            Seeing that "I scored 80% in Algebra but 30% in Geometry"
            is actionable — the student knows exactly where to focus next. */}
        {result.chapter_breakdown.length > 0 && (
          <div className="w-full">
            <h3 className="mb-3 font-bold text-text-main">Chapter Breakdown</h3>
            <div className="flex flex-col gap-2">
              {result.chapter_breakdown.map((ch) => (
                <div key={ch.chapter_name} className="flex items-center gap-3">
                  <span className="w-36 truncate text-sm text-text-muted">
                    {ch.chapter_name}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          ch.accuracy_pct >= 70
                            ? "bg-success"
                            : ch.accuracy_pct >= 40
                              ? "bg-warning"
                              : "bg-danger",
                        )}
                        style={{ width: `${ch.accuracy_pct}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "w-10 text-right text-xs font-bold",
                      ch.accuracy_pct >= 70
                        ? "text-success"
                        : ch.accuracy_pct >= 40
                          ? "text-warning"
                          : "text-danger",
                    )}
                  >
                    {ch.accuracy_pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => setShowReview(!showReview)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-text-main hover:bg-border/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              rate_review
            </span>
            {showReview ? "Hide" : "Review"} all answers
          </button>
          <button
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              replay
            </span>
            Try again
          </button>
          <button
            onClick={onDashboard}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              dashboard
            </span>
            Back to dashboard
          </button>
        </div>
      </div>

      {/* Review */}
      {showReview && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-text-main">Answer Review</h2>
          {result.items.map((item, i) => (
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
                <span
                  className={cn(
                    "material-symbols-outlined icon-fill",
                    item.is_correct ? "text-success" : "text-danger",
                  )}
                >
                  {item.is_correct ? "check_circle" : "cancel"}
                </span>
              </div>
              <p className="mb-3 font-medium text-text-main">
                {item.question_text}
              </p>
              {item.question_type === "mcq" && item.options && (
                <div className="flex flex-col gap-1.5 mb-3">
                  {Object.entries(item.options).map(([key, val]) => {
                    const isCorrect = val === item.correct_answer;
                    const isGiven = item.given_answer?.toUpperCase() === key;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm flex items-center gap-2",
                          isCorrect
                            ? "bg-success/10 font-semibold text-success"
                            : isGiven && !isCorrect
                              ? "bg-danger/10 font-semibold text-danger"
                              : "text-text-muted",
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
              {item.question_type !== "mcq" && (
                <div className="text-sm space-y-1">
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

// ── Main page ──────────────────────────────────────────────────
export default function ExamPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("subject-picker");
  const [examData, setExamData] = useState<StartExamOut | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // answers: question_id → given_answer string
  // WHY a Record (object) instead of array?
  // The user can jump to ANY question (non-linear). An object keyed by
  // question_id means O(1) lookup when checking if a question is answered,
  // regardless of which order the user visits questions.
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Subjects for the picker
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<
    Subject[]
  >({
    queryKey: ["subjects"],
    queryFn: () => api.get("/subjects").then((r) => r.data),
  });

  // Timer — only active during exam phase
  const timeLimitSecs = examData ? examData.time_limit_mins * 60 : 0;
  const { mins, secs, isLow } = useCountdown(
    timeLimitSecs,
    useCallback(() => {
      // Time expired — auto-submit with current answers
      if (examData && phase === "exam") {
        handleSubmit(examData, answers);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examData, answers, phase]),
  );

  async function startExam(subjectId: number) {
    try {
      const { data } = await api.post<StartExamOut>("/exam/start", {
        subject_id: subjectId,
      });
      setExamData(data);
      setAnswers({});
      setCurrentIdx(0);
      setPhase("exam");
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ??
          "Could not start exam. Make sure there are enough questions.",
      );
    }
  }

  async function handleSubmit(
    exam: StartExamOut,
    currentAnswers: Record<number, string>,
  ) {
    setPhase("submitting");
    setIsSubmitting(true);
    try {
      const payload = exam.questions.map((q) => ({
        question_id: q.question_id,
        given_answer: currentAnswers[q.question_id] ?? "",
        time_taken_seconds: 0,
      }));
      const { data } = await api.post<SubmitResult>(
        `/exam/${exam.session_id}/submit`,
        payload,
      );
      setResult(data);
      setPhase("results");
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ?? "Failed to submit. Please try again.",
      );
      setPhase("exam");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Phase: Subject picker ────────────────────────────────────
  if (phase === "subject-picker") {
    return (
      <div className="mx-auto flex max-w-[900px] flex-col gap-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
            Test Yourself
          </h1>
          <p className="mt-2 text-text-muted">
            Choose a subject for a full timed exam across all chapters. No
            chapter selection — just like a real test.
          </p>
        </div>

        {/* Exam rules */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              icon: "timer",
              text: "2 minutes per question",
              color: "bg-primary/10 text-primary",
            },
            {
              icon: "shuffle",
              text: "Questions from all chapters",
              color: "bg-purple-100 text-purple-600",
            },
            {
              icon: "rate_review",
              text: "See answers only at the end",
              color: "bg-warning/10 text-warning",
            },
          ].map((r) => (
            <div
              key={r.text}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg flex-shrink-0",
                  r.color,
                )}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {r.icon}
                </span>
              </div>
              <span className="text-sm font-medium text-text-muted">
                {r.text}
              </span>
            </div>
          ))}
        </div>

        {loadingSubjects ? (
          <div className="flex h-40 items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              progress_activity
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((s) => (
              <button
                key={s.subject_id}
                onClick={() => startExam(s.subject_id)}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                    s.color_class ?? "bg-primary/10 text-primary",
                  )}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {s.icon ?? "book"}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">
                    {s.subject_name}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {s.description}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-sm font-bold text-primary">
                  Start exam
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Phase: Submitting ────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">
            progress_activity
          </span>
          <p className="font-semibold text-text-main">Grading your exam...</p>
        </div>
      </div>
    );
  }

  // ── Phase: Results ───────────────────────────────────────────
  if (phase === "results" && result) {
    return (
      <ExamResults
        result={result}
        onRetry={() => {
          setPhase("subject-picker");
          setExamData(null);
          setResult(null);
        }}
        onDashboard={() => navigate("/dashboard")}
      />
    );
  }

  // ── Phase: Exam ──────────────────────────────────────────────
  if (!examData) return null;
  const currentQ = examData.questions[currentIdx];
  const answeredCount = Object.values(answers).filter((a) => a.trim()).length;
  const progress = Math.round((currentIdx / examData.questions.length) * 100);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Exam header — full-width, fixed */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-primary">
              school
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-main">
              {examData.subject_name}
            </p>
            <p className="text-xs text-text-muted">
              Exam Mode · {answeredCount}/{examData.total_questions} answered
            </p>
          </div>
        </div>

        {/* Countdown timer */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 transition-colors",
            isLow
              ? "border-danger/30 bg-danger/10"
              : "border-border bg-surface",
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined",
              isLow ? "text-danger animate-pulse" : "text-primary",
            )}
          >
            timer
          </span>
          <span
            className={cn(
              "font-mono text-lg font-black tabular-nums",
              isLow ? "text-danger" : "text-text-main",
            )}
          >
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          {isLow && (
            <span className="text-xs font-bold text-danger">Hurry!</span>
          )}
        </div>

        {/* Submit button — only active if at least 1 question answered */}
        <button
          disabled={answeredCount === 0 || isSubmitting}
          onClick={() => handleSubmit(examData, answers)}
          className={cn(
            "rounded-xl px-5 py-2 text-sm font-bold transition-all",
            answeredCount > 0
              ? "bg-primary text-white hover:bg-primary-hover"
              : "bg-border text-text-muted cursor-not-allowed",
          )}
        >
          {isSubmitting
            ? "Submitting..."
            : `Submit Exam (${answeredCount}/${examData.total_questions})`}
        </button>
      </header>

      {/* Main area: navigator sidebar + question content */}
      <div className="flex flex-1 overflow-hidden">
        <QuestionNavigator
          questions={examData.questions}
          answers={answers}
          current={currentIdx}
          onJump={setCurrentIdx}
        />

        {/* Question content */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6">
            {/* Progress + question counter */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-text-muted">
                  Question {currentIdx + 1} of {examData.total_questions}
                </span>
                <span className="text-primary">{progress}% through</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
              {/* Difficulty badge */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                    currentQ.difficulty === "easy"
                      ? "border-success/30 bg-success/10 text-success"
                      : currentQ.difficulty === "hard"
                        ? "border-danger/30 bg-danger/10 text-danger"
                        : "border-warning/30 bg-warning/10 text-warning",
                  )}
                >
                  {currentQ.difficulty}
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-text-muted capitalize">
                  {currentQ.question_type === "mcq"
                    ? "Multiple choice"
                    : currentQ.question_type === "fib"
                      ? "Fill in the blank"
                      : "Short answer"}
                </span>
                {/* NO "correct/wrong" feedback badge here — exam mode */}
              </div>

              {/* Question text */}
              <h2 className="text-xl font-bold leading-relaxed text-text-main md:text-2xl">
                {currentQ.question_text}
              </h2>

              {/* Answer area — MCQ */}
              {currentQ.question_type === "mcq" && currentQ.options && (
                <div className="flex flex-col gap-3">
                  {Object.entries(currentQ.options).map(([key, val]) => {
                    const selected = answers[currentQ.question_id] === key;
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-background",
                        )}
                      >
                        <input
                          type="radio"
                          name={`q_${currentQ.question_id}`}
                          value={key}
                          checked={selected}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQ.question_id]: key,
                            }))
                          }
                          className="accent-primary shrink-0"
                        />
                        <span className="flex-1 text-sm font-medium text-text-main">
                          <span className="mr-2 font-bold text-text-muted">
                            {key}.
                          </span>
                          {val}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Fill in the blank */}
              {currentQ.question_type === "fib" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Fill in the blank
                  </p>
                  <input
                    type="text"
                    value={answers[currentQ.question_id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.question_id]: e.target.value,
                      }))
                    }
                    placeholder="Type your answer..."
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {/* Short answer */}
              {currentQ.question_type === "short" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Short answer
                  </p>
                  <textarea
                    value={answers[currentQ.question_id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.question_id]: e.target.value,
                      }))
                    }
                    placeholder="Write your answer here..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => i - 1)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:bg-border/40 disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_back
                  </span>
                  Previous
                </button>
                <span className="text-xs text-text-muted">
                  {answers[currentQ.question_id]?.trim()
                    ? "✓ Answered"
                    : "Not answered"}
                </span>
                {currentIdx < examData.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((i) => i + 1)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
                  >
                    Next
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                ) : (
                  <button
                    disabled={answeredCount === 0}
                    onClick={() => handleSubmit(examData, answers)}
                    className="flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-success/90 disabled:opacity-50"
                  >
                    Submit Exam
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
