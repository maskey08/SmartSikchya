import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

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
  subjects: {
    subject_id: number;
    subject_name: string;
    icon: string | null;
    color_class: string | null;
    accuracy_pct: number | null;
    attempts: number;
  }[];
  recent_sessions: {
    session_id: number;
    chapter_name: string;
    accuracy_pct: number;
    xp_earned: number;
    date: string | null;
  }[];
}

function QuickAction({
  icon,
  label,
  color,
  to,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  to?: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={onClick ?? (() => to && navigate(to))}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
          color,
        )}
      >
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <span className="text-sm font-bold text-text-main">{label}</span>
    </button>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.full_name?.split(" ")[0] ?? "Student";

  const { data, isLoading } = useQuery<ProgressData>({
    queryKey: ["progress-me"],
    queryFn: () => api.get("/progress/me").then((r) => r.data),
    staleTime: 60_000,
  });

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Dynamic motivational message based on stats
  const getMotivation = (): string => {
    if (!data || data.total_sessions === 0)
      return "Start your first session to begin your adaptive learning journey! 🚀";
    if (data.overall_accuracy >= 80)
      return `Outstanding! ${data.overall_accuracy}% accuracy — you're mastering the content! 🏆`;
    if (data.overall_accuracy >= 60)
      return `Good progress! ${data.overall_accuracy}% accuracy. Keep pushing to reach 80%! 💪`;
    if (data.completed_sessions >= 5)
      return `${data.completed_sessions} sessions done! Consistency is building your skills. 📈`;
    return `${data.chapters_studied} chapters explored so far. Every session makes you smarter. 🎯`;
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
      {/* Dynamic welcome banner */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{greeting}!</p>
          <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
            Welcome back, <span className="text-primary">{firstName}</span>! 👋
          </h1>
          <p className="mt-2 max-w-xl text-text-muted">{getMotivation()}</p>
        </div>
        {/* XP progress ring area */}
        {!isLoading && data && (
          <div className="flex items-center gap-4 rounded-xl bg-background px-5 py-4 shrink-0">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-3xl text-warning icon-fill">
                stars
              </span>
              <p className="text-xl font-black text-warning">{data.total_xp}</p>
              <p className="text-[10px] text-text-muted">Total XP</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-3xl text-purple-500 icon-fill">
                military_tech
              </span>
              <p className="text-xl font-black text-text-main">
                Lv {data.level}
              </p>
              <p className="text-[10px] text-text-muted">
                {data.xp_to_next} XP left
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-border" />
          ))}
        </div>
      ) : (
        data && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                icon: "target",
                value: `${data.overall_accuracy}%`,
                label: "Accuracy",
                color: "bg-primary/10 text-primary",
              },
              {
                icon: "quiz",
                value: data.total_attempts,
                label: "Questions done",
                color: "bg-purple-100 text-purple-600",
              },
              {
                icon: "play_circle",
                value: data.completed_sessions,
                label: "Sessions finished",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: "menu_book",
                value: data.chapters_studied,
                label: "Chapters studied",
                color: "bg-success/10 text-success",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    s.color,
                  )}
                >
                  <span className="material-symbols-outlined text-lg">
                    {s.icon}
                  </span>
                </div>
                <p className="text-2xl font-black text-text-main">{s.value}</p>
                <p className="text-xs font-medium text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 font-bold text-text-main">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <QuickAction
            icon="menu_book"
            label="Practice"
            color="bg-primary/10 text-primary"
            to="/subjects"
          />
          <QuickAction
            icon="assignment"
            label="Test Yourself"
            color="bg-purple-100 text-purple-600"
            to="/exam"
          />
          <QuickAction
            icon="monitoring"
            label="My Progress"
            color="bg-blue-100 text-blue-600"
            to="/progress"
          />
          <QuickAction
            icon="lightbulb"
            label="For You"
            color="bg-warning/10 text-warning"
            to="/recommendations"
          />
        </div>
      </div>

      {/* Two-column: recent sessions + subject breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent sessions */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-text-main">Recent Sessions</h2>
            <button
              onClick={() => navigate("/progress")}
              className="text-xs font-bold text-primary hover:text-primary-hover"
            >
              View all →
            </button>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl bg-border"
                />
              ))}
            </div>
          ) : data?.recent_sessions.length === 0 ? (
            <div className="py-6 text-center">
              <span className="material-symbols-outlined text-3xl text-text-muted">
                history
              </span>
              <p className="mt-2 text-sm text-text-muted">
                No sessions yet. Start practising!
              </p>
              <button
                onClick={() => navigate("/subjects")}
                className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover transition-colors"
              >
                Browse Subjects
              </button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {data?.recent_sessions.slice(0, 5).map((s) => (
                <div
                  key={s.session_id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg text-xs font-black",
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
                        {s.date
                          ? new Date(s.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-warning">
                    +{s.xp_earned} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject performance */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-text-main">Subject Performance</h2>
            <button
              onClick={() => navigate("/subjects")}
              className="text-xs font-bold text-primary hover:text-primary-hover"
            >
              View all →
            </button>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-xl bg-border"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.subjects.map((subj) => (
                <div
                  key={subj.subject_id}
                  onClick={() => navigate(`/subjects/${subj.subject_id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-background"
                >
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg shrink-0",
                      subj.color_class ?? "bg-primary/10 text-primary",
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {subj.icon ?? "book"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-main">
                        {subj.subject_name}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold",
                          !subj.accuracy_pct
                            ? "text-text-muted"
                            : subj.accuracy_pct >= 70
                              ? "text-success"
                              : subj.accuracy_pct >= 40
                                ? "text-warning"
                                : "text-danger",
                        )}
                      >
                        {subj.accuracy_pct !== null
                          ? `${subj.accuracy_pct}%`
                          : "Not started"}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          !subj.accuracy_pct
                            ? "bg-border"
                            : subj.accuracy_pct >= 70
                              ? "bg-success"
                              : subj.accuracy_pct >= 40
                                ? "bg-warning"
                                : "bg-danger",
                        )}
                        style={{ width: `${subj.accuracy_pct ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
