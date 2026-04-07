/**
 * ProgressPage — personal learning analytics dashboard.
 *
 * WHY one API call (`/progress/me`) for all the data?
 * Because all the data is computed server-side from the same tables
 * (user_progress + practice_sessions). Doing 4 separate requests
 * would cause 4 loading spinners and 4 chances for inconsistency.
 * One endpoint = one loading state, all data arrives together.
 *
 * WHY useQuery with staleTime: 60s?
 * Progress data doesn't change during page navigation — only after
 * completing a session. 60s means the page feels instant on revisit
 * but refreshes after a minute. If the user just finished a session,
 * the results page invalidates this query cache explicitly.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { cn } from "@/lib/cn";

// ── Types matching the /progress/me response ──────────────────
interface ChapterDetail {
  chapter_id: number;
  chapter_name: string;
  order_num: number;
  attempts: number;
  correct: number;
  accuracy_pct: number | null;
  weakness_score: number | null;
  status: "not_started" | "struggling" | "improving" | "mastered";
}
interface SubjectBreakdown {
  subject_id: number;
  subject_name: string;
  icon: string | null;
  color_class: string | null;
  attempts: number;
  correct: number;
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

// ── Status config — maps status string to color + label ───────
// WHY a config object instead of if/else chains?
// Adding a new status later means editing ONE object, not hunting
// through multiple conditional blocks.
const STATUS_CONFIG = {
  not_started: {
    color: "text-text-muted",
    bg: "bg-border/30",
    label: "Not started",
    dot: "bg-text-muted",
  },
  struggling: {
    color: "text-danger",
    bg: "bg-danger/10",
    label: "Struggling",
    dot: "bg-danger",
  },
  improving: {
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Improving",
    dot: "bg-warning",
  },
  mastered: {
    color: "text-success",
    bg: "bg-success/10",
    label: "Mastered",
    dot: "bg-success",
  },
};

// ── Small reusable components ──────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          color,
        )}
      >
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-text-main">{value}</p>
        <p className="text-sm font-medium text-text-muted">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

function AccuracyBar({
  pct,
  size = "md",
}: {
  pct: number;
  size?: "sm" | "md";
}) {
  /**
   * WHY compute color in JS instead of Tailwind conditionals?
   * Tailwind purges unused classes. Dynamic string concatenation like
   * `bg-${color}-500` gets purged because Tailwind's scanner can't
   * detect dynamic class names. So we use cn() with explicit strings.
   */
  const color =
    pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-danger";
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-border", height)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

// ── Mini bar chart using recent sessions ──────────────────────
// WHY build this with divs instead of importing recharts?
// For a simple bar chart with 10 bars, importing a 200KB chart library
// is overkill. CSS flex + relative height is 5 lines and zero dependencies.
function SessionChart({ sessions }: { sessions: RecentSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-muted">
        No sessions yet — complete some practice to see your trend.
      </div>
    );
  }
  const maxXP = Math.max(...sessions.map((s) => s.xp_earned), 1);
  return (
    <div className="flex h-32 items-end gap-1.5">
      {[...sessions].reverse().map((s, i) => {
        const heightPct = Math.max(8, (s.xp_earned / maxXP) * 100);
        const color =
          s.accuracy_pct >= 70
            ? "bg-success/70 hover:bg-success"
            : s.accuracy_pct >= 40
              ? "bg-warning/70 hover:bg-warning"
              : "bg-danger/70 hover:bg-danger";
        return (
          <div
            key={s.session_id}
            className="group relative flex-1"
            title={`${s.chapter_name}: ${s.accuracy_pct}% (${s.correct}/${s.total_q})`}
          >
            <div
              className={cn(
                "w-full rounded-t-md transition-colors cursor-pointer",
                color,
              )}
              style={{ height: `${heightPct}%` }}
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg group-hover:block">
              <p className="font-bold text-text-main">{s.accuracy_pct}%</p>
              <p className="text-text-muted">{s.chapter_name}</p>
              <p className="text-warning">+{s.xp_earned} XP</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Subject accordion row ──────────────────────────────────────
function SubjectRow({
  subj,
  onPractice,
}: {
  subj: SubjectBreakdown;
  onPractice: (chapterId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const accuracy = subj.accuracy_pct ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {/* Header — click to expand */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-background"
      >
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl flex-shrink-0",
            subj.color_class ?? "bg-primary/10 text-primary",
          )}
        >
          <span className="material-symbols-outlined text-xl">
            {subj.icon ?? "book"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-text-main">
              {subj.subject_name}
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                accuracy >= 70
                  ? "text-success"
                  : accuracy >= 40
                    ? "text-warning"
                    : subj.attempts > 0
                      ? "text-danger"
                      : "text-text-muted",
              )}
            >
              {subj.attempts > 0 ? `${accuracy}%` : "Not started"}
            </span>
          </div>
          <AccuracyBar pct={accuracy} size="sm" />
          <div className="mt-1.5 flex gap-4 text-xs text-text-muted">
            <span>{subj.attempts} attempts</span>
            <span>
              {subj.chapters.filter((c) => c.attempts > 0).length}/
              {subj.chapters.length} chapters
            </span>
          </div>
        </div>
        <span
          className={cn(
            "material-symbols-outlined text-text-muted transition-transform",
            open && "rotate-180",
          )}
        >
          expand_more
        </span>
      </button>

      {/* Chapter breakdown — only rendered when open */}
      {open && (
        <div className="border-t border-border">
          {subj.chapters.map((ch) => {
            const cfg = STATUS_CONFIG[ch.status];
            return (
              <div
                key={ch.chapter_id}
                className="flex items-center gap-3 border-b border-border/50 px-5 py-3 last:border-b-0"
              >
                <div
                  className={cn("size-2 rounded-full flex-shrink-0", cfg.dot)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-main truncate">
                      {ch.chapter_name}
                    </span>
                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <span
                        className={cn(
                          "text-xs font-semibold rounded-full px-2 py-0.5",
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        {cfg.label}
                      </span>
                      {ch.accuracy_pct !== null && (
                        <span className="text-xs font-bold text-text-muted">
                          {ch.accuracy_pct}%
                        </span>
                      )}
                    </div>
                  </div>
                  {ch.attempts > 0 && (
                    <div className="mt-1">
                      <AccuracyBar pct={ch.accuracy_pct ?? 0} size="sm" />
                    </div>
                  )}
                  <p className="mt-0.5 text-xs text-text-muted">
                    {ch.attempts} attempts · {ch.correct} correct
                  </p>
                </div>
                {ch.status !== "mastered" && ch.status !== "not_started" && (
                  <button
                    onClick={() => onPractice(ch.chapter_id)}
                    className="flex-shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    Practice
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function ProgressPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<ProgressData>({
    queryKey: ["progress-me"],
    queryFn: () => api.get("/progress/me").then((r) => r.data),
    staleTime: 60_000, // 60 seconds — progress doesn't change mid-navigation
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
            Could not load progress data.
          </p>
        </div>
      </div>
    );
  }

  const xpPct = Math.round((data.xp_in_level / 500) * 100);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Progress & Analytics
        </h1>
        <p className="mt-1 text-text-muted">
          Your full learning history and performance breakdown.
        </p>
      </div>

      {/* ── XP + Level bar ──────────────────────────────────── */}
      {/* WHY show XP here and not just in the sidebar?
          The sidebar shows a small pill. Here we show the full context:
          current XP, level boundary, XP needed — giving the student
          a sense of how close they are to levelling up. */}
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-warning/20">
              <span className="material-symbols-outlined text-warning icon-fill">
                military_tech
              </span>
            </div>
            <div>
              <p className="font-black text-text-main">Level {data.level}</p>
              <p className="text-sm text-text-muted">
                {data.total_xp} total XP
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-warning">
              {data.xp_in_level} / 500 XP
            </p>
            <p className="text-xs text-text-muted">
              {data.xp_to_next} XP to Level {data.level + 1}
            </p>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-warning/20">
          <div
            className="h-full rounded-full bg-warning transition-all duration-1000"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* ── Stats cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon="target"
          label="Overall accuracy"
          value={`${data.overall_accuracy}%`}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon="quiz"
          label="Questions answered"
          value={data.total_attempts}
          sub={`${data.total_attempts - Math.round((data.total_attempts * data.overall_accuracy) / 100)} incorrect`}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon="play_circle"
          label="Sessions completed"
          value={data.completed_sessions}
          sub={`${data.total_sessions} total started`}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon="menu_book"
          label="Chapters studied"
          value={data.chapters_studied}
          color="bg-success/10 text-success"
        />
      </div>

      {/* ── Session activity chart ───────────────────────────── */}
      {/* WHY limit to 10 sessions?
          Bar width becomes unreadable with more. 10 bars at ~40px each
          fits cleanly in any viewport. The endpoint already returns 10. */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-text-main">
              Recent Session Activity
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Bar height = XP earned. Color = accuracy (green ≥70%, orange ≥40%,
              red &lt;40%)
            </p>
          </div>
        </div>
        <SessionChart sessions={data.recent_sessions} />
        {/* Session list below the chart for detail */}
        <div className="mt-4 divide-y divide-border/50">
          {data.recent_sessions.slice(0, 5).map((s) => (
            <div
              key={s.session_id}
              className="flex items-center justify-between py-2.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg text-xs font-black",
                    s.accuracy_pct >= 70
                      ? "bg-success/10 text-success"
                      : s.accuracy_pct >= 40
                        ? "bg-warning/10 text-warning"
                        : "bg-danger/10 text-danger",
                  )}
                >
                  {s.accuracy_pct}%
                </div>
                <div>
                  <p className="text-sm font-medium text-text-main">
                    {s.chapter_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {s.correct}/{s.total_q} correct
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-warning">
                  +{s.xp_earned} XP
                </p>
                <p className="text-xs text-text-muted">
                  {s.date
                    ? new Date(s.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Per-subject breakdown ───────────────────────────── */}
      {/* WHY accordion (collapsible) instead of always expanded?
          With 4 subjects and 2 chapters each = 8+ rows visible at once.
          Students usually care about ONE subject at a time. Accordion
          lets them focus without overwhelming scroll. */}
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-text-main">Subject Breakdown</h2>
        {data.subjects.map((subj) => (
          <SubjectRow
            key={subj.subject_id}
            subj={subj}
            onPractice={(chapterId) =>
              navigate(
                `/practice?chapter=${chapterId}&subject=${subj.subject_id}`,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
