import { useState, useCallback } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────
interface Option {
  [key: string]: string;
}
interface Question {
  id: string;
  chapter_id: string;
  subject_id: string;
  question_text: string;
  question_type: "mcq" | "fib" | "short";
  options?: Option;
  correct_answer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  hard: "bg-danger/10 text-danger",
};

// ── Sub-components ─────────────────────────────────────────────
function MCQQuestion({
  question,
  selected,
  onSelect,
  submitted,
}: {
  question: Question;
  selected: string;
  onSelect: (v: string) => void;
  submitted: boolean;
}) {
  const options = question.options ?? {};
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(options).map(([key, val]) => {
        const isCorrect = submitted && key === question.correct_answer;
        const isWrong =
          submitted && selected === key && key !== question.correct_answer;
        return (
          <label
            key={key}
            className={cn(
              "flex cursor-pointer items-center rounded-xl border p-4 transition-all",
              !submitted && selected === key
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "",
              !submitted && selected !== key
                ? "border-border hover:bg-background"
                : "",
              isCorrect ? "border-success bg-success/5" : "",
              isWrong ? "border-danger bg-danger/5" : "",
            )}
          >
            <input
              type="radio"
              name="mcq"
              value={key}
              checked={selected === key}
              onChange={() => !submitted && onSelect(key)}
              disabled={submitted}
              className="mr-3 accent-primary shrink-0"
            />
            <span className="flex-1 font-medium">
              <span className="mr-2 font-bold">{key}.</span>
              {val}
            </span>
            {isCorrect && (
              <span className="material-symbols-outlined ml-2 text-success">
                check_circle
              </span>
            )}
            {isWrong && (
              <span className="material-symbols-outlined ml-2 text-danger">
                cancel
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}

function FIBQuestion({
  question,
  value,
  onChange,
  submitted,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
}) {
  const isCorrect =
    submitted &&
    value.trim().toLowerCase() === question.correct_answer.toLowerCase();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
        Fill in the blank
      </p>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          disabled={submitted}
          className={cn(
            "w-full rounded-lg border bg-surface px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20",
            submitted
              ? isCorrect
                ? "border-success bg-success/5"
                : "border-danger bg-danger/5"
              : "border-border focus:border-primary",
          )}
        />
        {submitted && (
          <span
            className={cn(
              "material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2",
              isCorrect ? "text-success" : "text-danger",
            )}
          >
            {isCorrect ? "check_circle" : "cancel"}
          </span>
        )}
      </div>
      {submitted && !isCorrect && (
        <p className="text-sm font-semibold text-success">
          Correct answer:{" "}
          <span className="underline">{question.correct_answer}</span>
        </p>
      )}
    </div>
  );
}

function ShortQuestion({
  question,
  value,
  onChange,
  submitted,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
        Short Answer
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here..."
        disabled={submitted}
        className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {submitted && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Model Answer
          </p>
          <p className="mt-1 text-sm text-text-main">
            {question.correct_answer}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function QuizPage() {
  const navigate = useNavigate();
  const { chapterId } = useParams<{ chapterId: string }>(); // ← useParams replaces params prop
  const [searchParams] = useSearchParams(); // ← react-router-dom version
  const subjectId = searchParams.get("subject") ?? "";
  const { user } = useAuth();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({ correct: 0, total: 0 });
  const [showResult, setShowResult] = useState(false);

  const {
    data: questions = [],
    isLoading,
    isError,
  } = useQuery<Question[]>({
    queryKey: ["questions", chapterId],
    queryFn: async () => {
      const { data } = await api.get(`/chapters/${chapterId}/questions`);
      return data.questions ?? data;
    },
  });

  const currentQ = questions[currentIdx];
  const progress =
    questions.length > 0 ? (currentIdx / questions.length) * 100 : 0;

  const checkCorrect = useCallback((): boolean => {
    if (!currentQ) return false;
    if (currentQ.question_type === "mcq")
      return answer === currentQ.correct_answer;
    if (currentQ.question_type === "fib")
      return (
        answer.trim().toLowerCase() === currentQ.correct_answer.toLowerCase()
      );
    return true;
  }, [currentQ, answer]);

  async function handleSubmit() {
    if (!answer.trim() && currentQ.question_type !== "short") return;
    const isCorrect = checkCorrect();
    setSubmitted(true);
    setResults((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (user?.email) {
      try {
        await api.post("/progress", {
          user_id: user.email,
          question_id: currentQ.id,
          chapter_id: currentQ.chapter_id,
          subject_id: currentQ.subject_id,
          given_answer: answer,
          is_correct: isCorrect,
          mode: "course",
        });
      } catch {
        /* non-critical */
      }
    }
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      setShowResult(true);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setAnswer("");
    setSubmitted(false);
  }

  // ── Result screen ──────────────────────────────────────────
  if (showResult) {
    const pct = Math.round((results.correct / results.total) * 100);
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-10 shadow-lg">
          <div
            className={cn(
              "flex size-20 items-center justify-center rounded-full",
              pct >= 60 ? "bg-success/10" : "bg-danger/10",
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-4xl",
                pct >= 60 ? "text-success" : "text-danger",
              )}
            >
              {pct >= 60 ? "emoji_events" : "sentiment_dissatisfied"}
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-text-main">{pct}%</h1>
            <p className="text-text-muted">
              {results.correct} of {results.total} correct
            </p>
            <p className="mt-2 font-semibold text-text-main">
              {pct >= 80
                ? "Excellent work! 🎉"
                : pct >= 60
                  ? "Good effort! Keep going 💪"
                  : "Keep practising — you'll get there! 📚"}
            </p>
          </div>
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/subjects/${subjectId}`)}
            >
              Back to Chapters
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setCurrentIdx(0);
                setAnswer("");
                setSubmitted(false);
                setResults({ correct: 0, total: 0 });
                setShowResult(false);
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );

  if (isError || !currentQ)
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <span className="material-symbols-outlined text-5xl text-danger">
            error
          </span>
          <p className="mt-4 font-semibold text-text-main">
            Could not load questions.
          </p>
          <Link
            to="/subjects"
            className="mt-4 inline-block text-primary hover:underline"
          >
            ← Back to Subjects
          </Link>
        </div>
      </div>
    );

  // ── Main question view ─────────────────────────────────────
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      {/* Breadcrumb + score */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Link to="/subjects" className="hover:text-primary">
            Subjects
          </Link>
          <span className="material-symbols-outlined text-xs">
            chevron_right
          </span>
          <Link to={`/subjects/${subjectId}`} className="hover:text-primary">
            Chapters
          </Link>
          <span className="material-symbols-outlined text-xs">
            chevron_right
          </span>
          <span className="font-semibold text-primary">Questions</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-success">
            ✓ {results.correct}
          </span>
          <span className="text-text-muted">|</span>
          <span className="text-sm font-bold text-danger">
            ✗ {results.total - results.correct}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/subjects/${subjectId}`)}
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-text-muted">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <span className="text-primary">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-10">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold capitalize border border-primary text-primary",
            )}
          >
            {currentQ.question_type === "mcq"
              ? "Multiple Choice"
              : currentQ.question_type === "fib"
                ? "Fill in the Blank"
                : "Short Answer"}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
              DIFFICULTY_COLOR[currentQ.difficulty],
            )}
          >
            {currentQ.difficulty}
          </span>
        </div>

        <h2 className="text-xl font-bold leading-relaxed text-text-main md:text-2xl">
          {currentQ.question_text}
        </h2>

        {currentQ.question_type === "mcq" && (
          <MCQQuestion
            question={currentQ}
            selected={answer}
            onSelect={setAnswer}
            submitted={submitted}
          />
        )}
        {currentQ.question_type === "fib" && (
          <FIBQuestion
            question={currentQ}
            value={answer}
            onChange={setAnswer}
            submitted={submitted}
          />
        )}
        {currentQ.question_type === "short" && (
          <ShortQuestion
            question={currentQ}
            value={answer}
            onChange={setAnswer}
            submitted={submitted}
          />
        )}

        {submitted && currentQ.explanation && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Explanation
            </p>
            <p className="mt-1 text-sm text-text-main">
              {currentQ.explanation}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="ghost" onClick={handleNext} disabled={!submitted}>
            Skip
          </Button>
          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="px-8"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2 px-8">
              {currentIdx + 1 >= questions.length
                ? "See Results"
                : "Next Question"}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
