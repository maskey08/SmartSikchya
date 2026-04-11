/**
 * AIExplanationSidebar — floating button + right sidebar for AI explanations.
 *
 * BEHAVIOUR:
 * 1. Floating circle button fixed at bottom-right during practice
 * 2. Clicking opens a right sidebar
 * 3. If question NOT answered: shows correct answer auto-selected (marked Skipped, 0 XP)
 *    with an "Explain this" button
 * 4. If question WAS answered: shows "Explain this" button directly
 * 5. Pressing "Explain this" calls Gemini and streams the response
 *
 * WHY a separate component and not inline in PracticePage?
 * PracticePage is already complex (session state machine).
 * The AI sidebar is an independent UI concern — it reads question state
 * but doesn't modify it (except the skip action). Separating them means
 * both can be tested and modified independently.
 */
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/axios";

interface Question {
  question_id: number;
  question_text: string;
  question_type: "mcq" | "fib" | "short";
  options: Record<string, string> | null;
  difficulty: string;
}

interface AIExplanationSidebarProps {
  question: Question | null;
  sessionId: number | null;
  isAnswered: boolean; // has the user submitted an answer
  givenAnswer: string; // the answer they gave (or '' if not yet)
  correctAnswer: string; // the known correct answer
  onSkip: () => void; // called when "Skip to explanation" is pressed
}

export function AIExplanationSidebar({
  question,
  sessionId,
  isAnswered,
  givenAnswer,
  correctAnswer,
  onSkip,
}: AIExplanationSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);

  // Reset when question changes
  useEffect(() => {
    setExplanation(null);
    setError(null);
    setIsLoading(false);
    setShowCorrect(false);
  }, [question?.question_id]);

  // Close sidebar when question changes
  useEffect(() => {
    // Don't auto-close — let user keep it open
  }, [question?.question_id]);

  async function handleExplain() {
    if (!question || !sessionId) return;
    setIsLoading(true);
    setError(null);
    setExplanation(null);

    try {
      // Call the backend explanation endpoint directly with the correct answer
      const { data } = await api.post("/sessions/explain", {
        question_text: question.question_text,
        correct_answer: correctAnswer,
        context: `Question type: ${question.question_type}, Difficulty: ${question.difficulty}`,
      });
      setExplanation(data.explanation);
    } catch {
      setError("Could not get explanation. Check your Gemini API key.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkipToExplain() {
    setShowCorrect(true);
    onSkip(); // parent marks as skipped (no XP, auto-advances)
  }

  if (!question) return null;

  return (
    <>
      {/* Floating trigger button — fixed bottom-right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="AI Explanation"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110",
          isOpen
            ? "bg-primary text-white"
            : "bg-surface border-2 border-primary text-primary hover:bg-primary/10",
        )}
      >
        {/* Pulse ring — always visible to draw attention */}
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-30",
            !isOpen && "animate-ping bg-primary",
          )}
        />
        <span className="material-symbols-outlined text-2xl icon-fill relative z-10">
          {isOpen ? "close" : "auto_awesome"}
        </span>
      </button>

      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Right sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[18px] icon-fill">
                auto_awesome
              </span>
            </div>
            <div>
              <p className="font-bold text-text-main text-sm">AI Explanation</p>
              <p className="text-[10px] text-text-muted">Powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-border/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          {/* Question preview */}
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Current Question
            </p>
            <p className="text-sm text-text-main leading-relaxed line-clamp-4">
              {question.question_text}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                  question.difficulty === "easy"
                    ? "border-success/30 bg-success/10 text-success"
                    : question.difficulty === "hard"
                      ? "border-danger/30 bg-danger/10 text-danger"
                      : "border-warning/30 bg-warning/10 text-warning",
                )}
              >
                {question.difficulty}
              </span>
            </div>
          </div>

          {/* State: NOT answered yet */}
          {!isAnswered && !showCorrect && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm font-semibold text-warning mb-1">
                  ⚠ Question not answered
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  You haven't answered this question yet. You can skip it to get
                  an explanation, but you won't earn XP for this question.
                </p>
              </div>

              <button
                onClick={handleSkipToExplain}
                className="flex items-center justify-center gap-2 rounded-xl border border-warning/30 bg-warning/5 py-3 text-sm font-bold text-warning hover:bg-warning/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  skip_next
                </span>
                Skip & Explain (0 XP)
              </button>
            </div>
          )}

          {/* Show correct answer after skip */}
          {showCorrect && !isAnswered && (
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-success mb-2">
                Correct Answer
              </p>
              {question.question_type === "mcq" && question.options ? (
                <div className="flex flex-col gap-1.5">
                  {Object.entries(question.options).map(([key, val]) => (
                    <div
                      key={key}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        val === correctAnswer
                          ? "bg-success/10 font-semibold text-success"
                          : "text-text-muted",
                      )}
                    >
                      <span className="font-bold mr-1.5">{key}.</span>
                      {val}
                      {val === correctAnswer && (
                        <span className="material-symbols-outlined ml-2 text-sm icon-fill text-success">
                          check_circle
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-success">
                  {correctAnswer}
                </p>
              )}
            </div>
          )}

          {/* Explain button — show when answered OR after skip */}
          {(isAnswered || showCorrect) && !explanation && !isLoading && (
            <button
              onClick={handleExplain}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] icon-fill">
                lightbulb
              </span>
              Explain this question
            </button>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined animate-spin text-primary">
                  progress_activity
                </span>
              </div>
              <p className="text-sm text-text-muted">Gemini is thinking...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              <p className="font-bold mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Explanation result */}
          {explanation && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary icon-fill">
                  auto_awesome
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  AI Explanation
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">
                  {explanation}
                </p>
              </div>
              <button
                onClick={handleExplain}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  refresh
                </span>
                Regenerate
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <p className="text-[10px] text-text-muted text-center">
            AI explanations may occasionally be inaccurate. Verify with your
            textbook.
          </p>
        </div>
      </div>
    </>
  );
}
