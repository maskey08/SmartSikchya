/**
 * RecommendationsPage — rule-based "what to study next" view.
 *
 * WHY rule-based instead of AI?
 * The AI (DistilBERT) classifies QUESTION DIFFICULTY — it operates on
 * question text. Recommendations are about STUDENT PERFORMANCE — which
 * chapters you're weak at. That's answered by arithmetic on user_progress
 * data, not NLP. The rules are simple and explainable, which is good for
 * an educational context (students should understand WHY they're recommended
 * something).
 *
 * The three buckets:
 *   "Review needed"  → accuracy < 50%  (you've tried but struggled)
 *   "Not tried yet"  → 0 attempts       (gaps in your study)
 *   "Keep momentum"  → accuracy ≥ 80%   (mastered, show positive reinforcement)
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────
interface RecommendationItem {
  chapter_id: number;
  chapter_name: string;
  subject_name: string;
  subject_icon: string | null;
  color_class: string | null;
  type: "struggling" | "not_started" | "ready";
  reason: string;
  accuracy_pct: number | null;
  attempts: number;
}
interface RecommendationData {
  struggling: RecommendationItem[];
  not_started: RecommendationItem[];
  ready: RecommendationItem[];
  summary: {
    total_struggling: number;
    total_not_started: number;
    total_mastered: number;
  };
}

// ── Card for one recommendation ────────────────────────────────
function RecommendationCard({
  item,
  ctaLabel,
  ctaColor,
  onAction,
}: {
  item: RecommendationItem;
  ctaLabel: string;
  ctaColor: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-col gap-3">
        {/* Subject pill */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-sm",
              item.color_class ?? "bg-primary/10 text-primary",
            )}
          >
            <span className="material-symbols-outlined text-[18px]">
              {item.subject_icon ?? "book"}
            </span>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {item.subject_name}
          </span>
        </div>

        {/* Chapter name */}
        <h3 className="font-bold text-text-main leading-tight">
          {item.chapter_name}
        </h3>

        {/* Reason — the explainable part */}
        <p className="text-sm text-text-muted leading-relaxed">{item.reason}</p>

        {/* Accuracy bar if they've attempted it */}
        {item.accuracy_pct !== null && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-text-muted">
              <span>{item.attempts} attempts</span>
              <span className="font-bold">{item.accuracy_pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  item.accuracy_pct >= 70
                    ? "bg-success"
                    : item.accuracy_pct >= 40
                      ? "bg-warning"
                      : "bg-danger",
                )}
                style={{ width: `${item.accuracy_pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <button
        onClick={onAction}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors",
          ctaColor,
        )}
      >
        <span className="material-symbols-outlined text-[18px]">
          {item.type === "ready" ? "arrow_forward" : "replay"}
        </span>
        {ctaLabel}
      </button>
    </div>
  );
}

// ── Section with count badge ───────────────────────────────────
function Section({
  title,
  icon,
  iconColor,
  count,
  children,
  emptyMessage,
}: {
  title: string;
  icon: string;
  iconColor: string;
  count: number;
  children: React.ReactNode;
  emptyMessage: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            iconColor,
          )}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h2 className="font-bold text-text-main">{title}</h2>
        <span className="rounded-full bg-border px-2.5 py-0.5 text-xs font-bold text-text-muted">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm text-text-muted">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function RecommendationsPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<RecommendationData>({
    queryKey: ["recommendations-me"],
    queryFn: () => api.get("/recommendations/me").then((r) => r.data),
    // WHY 2 minute stale time here vs 60s for progress?
    // Recommendations change less often than raw progress numbers.
    // A new practice session changes accuracy by ~10%, which might not
    // flip a chapter from "struggling" to "improving". So we can afford
    // a longer cache before refetching.
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <span className="material-symbols-outlined text-5xl text-danger">
            error
          </span>
          <p className="mt-3 font-semibold text-text-main">
            Could not load recommendations.
          </p>
        </div>
      </div>
    );
  }

  const hasAnyData =
    data.struggling.length > 0 ||
    data.not_started.length > 0 ||
    data.ready.length > 0;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Your Learning Path
        </h1>
        <p className="mt-1 text-text-muted">
          Personalised suggestions based on your performance — no AI needed for
          this part.
        </p>
      </div>

      {/* Summary bar — quick snapshot of where you stand */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Need review",
            value: data.summary.total_struggling,
            color: "bg-danger/10 text-danger",
            icon: "priority_high",
          },
          {
            label: "Not started",
            value: data.summary.total_not_started,
            color: "bg-warning/10 text-warning",
            icon: "hourglass_empty",
          },
          {
            label: "Mastered",
            value: data.summary.total_mastered,
            color: "bg-success/10 text-success",
            icon: "verified",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("flex items-center gap-3 rounded-2xl p-4", s.color)}
          >
            <span className="material-symbols-outlined text-2xl icon-fill">
              {s.icon}
            </span>
            <div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state — before any sessions */}
      {!hasAnyData && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-background py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-text-muted">
            lightbulb
          </span>
          <div>
            <p className="font-bold text-text-main">No recommendations yet!</p>
            <p className="mt-1 text-sm text-text-muted">
              Complete some practice sessions first — recommendations appear
              after your first session.
            </p>
          </div>
          <button
            onClick={() => navigate("/subjects")}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
          >
            Start practising
          </button>
        </div>
      )}

      {/* ── STRUGGLING — highest priority ─────────────────── */}
      {/* WHY show struggling first?
          Students benefit most from fixing weak areas.
          Showing "mastered" chapters first would be feel-good but
          pedagogically backwards. Worst-first maximises learning efficiency. */}
      {hasAnyData && (
        <>
          <Section
            title="Review Needed"
            icon="priority_high"
            iconColor="bg-danger/10 text-danger"
            count={data.summary.total_struggling}
            emptyMessage="No struggling chapters — great work! 🎉"
          >
            {data.struggling.map((item) => (
              <RecommendationCard
                key={item.chapter_id}
                item={item}
                ctaLabel="Review now"
                ctaColor="bg-danger text-white hover:bg-danger/90"
                onAction={() =>
                  navigate(`/practice?chapter=${item.chapter_id}`)
                }
              />
            ))}
          </Section>

          {/* ── NOT STARTED ───────────────────────────────── */}
          {/* WHY only 1 per subject?
              Showing ALL unstarted chapters is overwhelming.
              We show the FIRST chapter of each subject — a gentle
              nudge to start, not a wall of TODO items. */}
          <Section
            title="Not Started Yet"
            icon="hourglass_empty"
            iconColor="bg-warning/10 text-warning"
            count={data.summary.total_not_started}
            emptyMessage="You've tried every chapter — impressive! ⭐"
          >
            {data.not_started.map((item) => (
              <RecommendationCard
                key={item.chapter_id}
                item={item}
                ctaLabel="Start now"
                ctaColor="bg-warning text-white hover:bg-warning/90"
                onAction={() =>
                  navigate(`/practice?chapter=${item.chapter_id}`)
                }
              />
            ))}
          </Section>

          {/* ── MASTERED / READY ──────────────────────────── */}
          <Section
            title="Keep the Momentum"
            icon="verified"
            iconColor="bg-success/10 text-success"
            count={data.summary.total_mastered}
            emptyMessage="Keep practising — mastered chapters will appear here."
          >
            {data.ready.map((item) => (
              <RecommendationCard
                key={item.chapter_id}
                item={item}
                ctaLabel="Challenge mode"
                ctaColor="bg-success text-white hover:bg-success/90"
                onAction={() =>
                  navigate(`/practice?chapter=${item.chapter_id}`)
                }
              />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
