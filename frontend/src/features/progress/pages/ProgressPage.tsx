/**
 * ProgressPage — shows everything about a student's learning history.
 *
 * Why this structure?
 * - Single API call to GET /progress/me returns everything.
 *   Avoids waterfall requests (fetching subjects, then chapters, then progress separately).
 * - Stats strip at top = quick win (user sees numbers immediately while chart loads)
 * - Subject accordion = expandable — keeps the page clean for students with many subjects
 * - Recent sessions table = accountability — student sees exactly what they did
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { cn } from "@/lib/cn";

// ── Types matching the backend response ───────────────────────
interface ChapterDetail {
  chapter_id: number;
  chapter_name: string;
  order_num: number;
  attempts: number;
  correct: number;
  accuracy_pct: number | null;
  weakness_score: number | null;
  status: "not_started" | "mastered" | "improving" | "struggling";
}

interface SubjectBreakdown {
  subject_id: number;
  subject_name: string;
  icon: string | null;
  color_class: string | null;
  attempts: number;
  accuracy_pct: number | null;
  chapters: ChapterDetail[];
}

interface RecentSession {
  session_id: number;
  chapter_name: string;
  correct: number;
  total_q: number;
  accuracy_pct: number;
  xp_earned: number;
  date: string | null;
}

interface ProgressData {
  total_xp: number;
  level: number;
  xp_in_level: number;
  xp_to_next: number;
  overall_accuracy: number;
  total_attempts: number;
  chapters_studied: number;
  total_sessions: number;
  completed_sessions: number;
  subjects: SubjectBreakdown[];
  recent_sessions: RecentSession[];
}

// ── Status config — drives both icon and colour ────────────────
// Why put config in an object? Avoids repeating cn() logic everywhere.
const STATUS_CONFIG = {
  mastered: {
    icon: "emoji_events",
    color: "text-success",
    bg: "bg-success/10",
    label: "Mastered",
  },
  improving: {
    icon: "trending_up",
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Improving",
  },
  struggling: {
    icon: "priority_high",
    color: "text-danger",
    bg: "bg-danger/10",
    label: "Struggling",
  },
  not_started: {
    icon: "radio_button_unchecked",
    color: "text-text-muted",
    bg: "bg-border/50",
    label: "Not started",
  },
};

// ── Mini bar chart — no library needed for simple 7-item ──────
function AccuracyBar({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-text-muted">—</span>;
  }
  const color =
    pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-bold",
          pct >= 80
            ? "text-success"
            : pct >= 50
              ? "text-warning"
              : "text-danger",
        )}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<ProgressData>({
    queryKey: ["progress-me"],
    queryFn: () => api.get("/progress/me").then((r) => r.data),
    // Refetch on window focus so data is fresh after a session
    refetchOnWindowFocus: true,
    staleTime: 30_000, // 30s stale time — progress doesn't change every second
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
      <div className="mx-auto max-w-[1200px] p-8 text-center text-danger">
        <span className="material-symbols-outlined text-5xl">error</span>
        <p className="mt-4 font-semibold">
          Could not load progress. Is the backend running?
        </p>
      </div>
    );
  }

  const xpPercent = Math.round((data.xp_in_level / 500) * 100);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      {/* ── Page header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Progress & Analytics
        </h1>
        <p className="mt-1 text-text-muted">
          A detailed view of your learning journey.
        </p>
      </div>

      {/* ── XP / Level card ─────────────────────────────────── */}
      {/* Why first? XP is motivating — it's the first thing a student wants to see. */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:gap-8">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-warning/10">
            <span className="material-symbols-outlined text-3xl text-warning icon-fill">
              military_tech
            </span>
          </div>
          <div>
            <p className="text-4xl font-black text-text-main">
              Level {data.level}
            </p>
            <p className="text-sm text-text-muted">{data.total_xp} total XP</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2 flex justify-between text-xs font-medium">
            <span className="text-text-muted">
              Progress to Level {data.level + 1}
            </span>
            <span className="font-bold text-warning">
              {data.xp_in_level} / 500 XP
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-warning transition-all duration-1000"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            {data.xp_to_next} XP to next level
          </p>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────── */}
      {/* Quick stats in a horizontal row — scannable at a glance */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            icon: "target",
            label: "Overall accuracy",
            value: `${data.overall_accuracy}%`,
            color: "text-primary",
          },
          {
            icon: "quiz",
            label: "Total questions",
            value: data.total_attempts,
            color: "text-purple-600",
          },
          {
            icon: "menu_book",
            label: "Chapters studied",
            value: data.chapters_studied,
            color: "text-blue-600",
          },
          {
            icon: "check_circle",
            label: "Exams completed",
            value: data.completed_sessions,
            color: "text-success",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <span className={cn("material-symbols-outlined", s.color)}>
              {s.icon}
            </span>
            <p className="text-2xl font-black text-text-main">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Per-subject breakdown ────────────────────────────── */}
      {/*
        Accordion pattern: show subject summary, expand to see chapters.
        Why accordion? Students may have 4+ subjects — showing all chapters
        at once would be overwhelming.
      */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-text-main">Subject Breakdown</h2>
        {data.subjects.map((subj) => (
          <SubjectAccordion
            key={subj.subject_id}
            subject={subj}
            navigate={navigate}
          />
        ))}
      </div>

      {/* ── Recent sessions ─────────────────────────────────── */}
      {data.recent_sessions.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text-main">Recent Sessions</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3 text-left">Chapter</th>
                  <th className="px-5 py-3 text-left">Score</th>
                  <th className="px-5 py-3 text-left">Accuracy</th>
                  <th className="px-5 py-3 text-left">XP</th>
                  <th className="px-5 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recent_sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="hover:bg-background transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-text-main">
                      {s.chapter_name}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {s.correct}/{s.total_q}
                    </td>
                    <td className="px-5 py-3">
                      <AccuracyBar pct={s.accuracy_pct} />
                    </td>
                    <td className="px-5 py-3 font-bold text-warning">
                      +{s.xp_earned}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted">
                      {s.date ? new Date(s.date).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state — user has never done a session */}
      {data.total_sessions === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-text-muted">
            school
          </span>
          <h3 className="text-xl font-bold text-text-main">No sessions yet</h3>
          <p className="text-text-muted">
            Complete your first practice session to see your progress here.
          </p>
          <button
            onClick={() => navigate("/subjects")}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
          >
            Start practising
          </button>
        </div>
      )}
    </div>
  );
}

// ── Accordion component — subject → chapters ────────────────────
function SubjectAccordion({
  subject,
  navigate,
}: {
  subject: SubjectBreakdown;
  navigate: (to: string) => void;
}) {
  // Use React's built-in useState — no need for external lib for a simple toggle
  const [open, setOpen] = require("react").useState(false);

  const attempted = subject.chapters.filter((c) => c.attempts > 0).length;
  const total = subject.chapters.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 p-5 text-left hover:bg-background transition-colors"
      >
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl flex-shrink-0",
            subject.color_class ?? "bg-primary/10 text-primary",
          )}
        >
          <span className="material-symbols-outlined">
            {subject.icon ?? "menu_book"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-text-main">
              {subject.subject_name}
            </span>
            <span className="text-xs text-text-muted">
              {attempted}/{total} chapters attempted
            </span>
          </div>
          {subject.accuracy_pct !== null ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    "h-full rounded-full",
                    subject.accuracy_pct >= 80
                      ? "bg-success"
                      : subject.accuracy_pct >= 50
                        ? "bg-warning"
                        : "bg-danger",
                  )}
                  style={{ width: `${subject.accuracy_pct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-text-muted">
                {subject.accuracy_pct}% avg accuracy
              </span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">Not started yet</span>
          )}
        </div>

        <span
          className="material-symbols-outlined text-text-muted transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      {/* Chapter rows — shown when expanded */}
      {open && (
        <div className="border-t border-border">
          {subject.chapters.map((ch) => {
            const cfg = STATUS_CONFIG[ch.status];
            return (
              <div
                key={ch.chapter_id}
                className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-background transition-colors"
              >
                {/* Status icon */}
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg flex-shrink-0",
                    cfg.bg,
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[16px]",
                      cfg.color,
                    )}
                  >
                    {cfg.icon}
                  </span>
                </div>

                {/* Chapter name + status */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-main">
                    {ch.chapter_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {ch.attempts > 0
                      ? `${ch.attempts} attempts · ${ch.correct} correct`
                      : "Not attempted"}
                  </p>
                </div>

                {/* Accuracy bar */}
                <div className="hidden sm:block">
                  <AccuracyBar pct={ch.accuracy_pct} />
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "hidden text-xs font-semibold md:block",
                    cfg.color,
                  )}
                >
                  {cfg.label}
                </span>

                {/* Practice button */}
                <button
                  onClick={() =>
                    navigate(
                      `/practice?chapter=${ch.chapter_id}&subject=${subject.subject_id}`,
                    )
                  }
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-text-muted hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    play_arrow
                  </span>
                  {ch.attempts > 0 ? "Retry" : "Start"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
