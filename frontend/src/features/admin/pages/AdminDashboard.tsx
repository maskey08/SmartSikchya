import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────
interface Stats {
  total_users: number;
  total_questions: number;
  total_sessions: number;
  completed_sessions: number;
  total_subjects: number;
  recent_sessions: RecentSession[];
}
interface RecentSession {
  session_id: number;
  user_email: string;
  user_name: string;
  chapter_name: string;
  is_completed: boolean;
  correct_count: number;
  total_q: number;
  xp_earned: number;
  start_time: string | null;
}
interface AdminUser {
  user_id: number;
  full_name: string | null;
  email: string;
  role: string;
  total_xp: number;
  level: number;
  session_count: number;
  created_at: string | null;
}
interface AdminQuestion {
  question_id: number;
  subject_id: number;
  chapter_id: number;
  question_text: string;
  question_type: number;
  options: string[] | null;
  correct_answer: string | null;
  difficulty: string;
}

// ── API helpers ────────────────────────────────────────────────
const adminApi = {
  stats: () => api.get<Stats>("/admin/stats").then((r) => r.data),
  users: () => api.get<AdminUser[]>("/admin/users").then((r) => r.data),
  questions: (chapter_id?: number) =>
    api
      .get<
        AdminQuestion[]
      >("/admin/questions", { params: chapter_id ? { chapter_id } : {} })
      .then((r) => r.data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  setRole: (id: number, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  deleteQ: (id: number) => api.delete(`/admin/questions/${id}`),
};

type Tab = "overview" | "users" | "questions";

// ── Sub-components ─────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-xl",
          color,
        )}
      >
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-text-main">{value}</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [qFilter, setQFilter] = useState("");
  const qc = useQueryClient();

  const { data: stats, isLoading: loadStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminApi.stats,
  });
  const { data: users, isLoading: loadUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.users,
    enabled: tab === "users",
  });
  const { data: questions, isLoading: loadQs } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: () => adminApi.questions(),
    enabled: tab === "questions",
  });

  const deleteUser = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const promoteUser = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminApi.setRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deleteQ = useMutation({
    mutationFn: adminApi.deleteQ,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-questions"] }),
  });

  const filteredQs = questions?.filter(
    (q) =>
      !qFilter || q.question_text.toLowerCase().includes(qFilter.toLowerCase()),
  );

  const TYPE_LABEL: Record<number, string> = { 1: "MCQ", 2: "Short", 3: "FIB" };
  const DIFF_COLOR: Record<string, string> = {
    easy: "bg-success/10 text-success",
    medium: "bg-warning/10 text-warning",
    hard: "bg-danger/10 text-danger",
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "overview", icon: "dashboard", label: "Overview" },
    { id: "users", icon: "group", label: "Users" },
    { id: "questions", icon: "quiz", label: "Questions" },
  ];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-text-muted">
            Manage users, content, and monitor platform activity.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2">
          <span className="material-symbols-outlined text-warning">
            admin_panel_settings
          </span>
          <span className="text-sm font-bold text-warning">Admin Mode</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 pb-3 pt-1 text-sm font-semibold transition-colors",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main",
            )}
          >
            <span className="material-symbols-outlined text-[18px]">
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          {loadStats ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl bg-border"
                />
              ))}
            </div>
          ) : (
            stats && (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  <StatCard
                    icon="group"
                    label="Total users"
                    value={stats.total_users}
                    color="bg-primary/10 text-primary"
                  />
                  <StatCard
                    icon="quiz"
                    label="Questions"
                    value={stats.total_questions}
                    color="bg-purple-100 text-purple-600"
                  />
                  <StatCard
                    icon="play_circle"
                    label="Sessions"
                    value={stats.total_sessions}
                    color="bg-blue-100 text-blue-600"
                  />
                  <StatCard
                    icon="check_circle"
                    label="Completed"
                    value={stats.completed_sessions}
                    color="bg-success/10 text-success"
                  />
                  <StatCard
                    icon="menu_book"
                    label="Subjects"
                    value={stats.total_subjects}
                    color="bg-warning/10 text-warning"
                  />
                </div>

                <div className="rounded-2xl border border-border bg-surface shadow-sm">
                  <div className="border-b border-border px-6 py-4">
                    <h2 className="font-bold text-text-main">
                      Recent Practice Sessions
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-background text-xs uppercase tracking-wider text-text-muted">
                          <th className="px-6 py-3 text-left">User</th>
                          <th className="px-6 py-3 text-left">Chapter</th>
                          <th className="px-6 py-3 text-left">Score</th>
                          <th className="px-6 py-3 text-left">XP</th>
                          <th className="px-6 py-3 text-left">Status</th>
                          <th className="px-6 py-3 text-left">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {stats.recent_sessions.map((s) => (
                          <tr
                            key={s.session_id}
                            className="hover:bg-background transition-colors"
                          >
                            <td className="px-6 py-3">
                              <p className="font-medium text-text-main">
                                {s.user_name || "—"}
                              </p>
                              <p className="text-xs text-text-muted">
                                {s.user_email}
                              </p>
                            </td>
                            <td className="px-6 py-3 text-text-muted">
                              {s.chapter_name}
                            </td>
                            <td className="px-6 py-3">
                              {s.total_q > 0 ? (
                                <span
                                  className={cn(
                                    "font-semibold",
                                    s.correct_count / s.total_q >= 0.7
                                      ? "text-success"
                                      : s.correct_count / s.total_q >= 0.4
                                        ? "text-warning"
                                        : "text-danger",
                                  )}
                                >
                                  {s.correct_count}/{s.total_q}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-6 py-3 font-bold text-warning">
                              +{s.xp_earned}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                                  s.is_completed
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning",
                                )}
                              >
                                {s.is_completed ? "Completed" : "In progress"}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-xs text-text-muted">
                              {s.start_time
                                ? new Date(s.start_time).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {stats.recent_sessions.length === 0 && (
                      <p className="py-8 text-center text-text-muted">
                        No sessions yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-bold text-text-main">
              All Users ({users?.length ?? 0})
            </h2>
          </div>
          {loadUsers ? (
            <div className="p-6 text-center text-text-muted">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background text-xs uppercase tracking-wider text-text-muted">
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">XP / Level</th>
                    <th className="px-6 py-3 text-left">Sessions</th>
                    <th className="px-6 py-3 text-left">Joined</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users?.map((u) => (
                    <tr
                      key={u.user_id}
                      className="hover:bg-background transition-colors"
                    >
                      <td className="px-6 py-3">
                        <p className="font-medium text-text-main">
                          {u.full_name || "—"}
                        </p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold capitalize",
                            u.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-border text-text-muted",
                          )}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-warning">
                          {u.total_xp} XP
                        </span>
                        <span className="ml-2 text-xs text-text-muted">
                          Lv.{u.level}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-text-muted">
                        {u.session_count}
                      </td>
                      <td className="px-6 py-3 text-xs text-text-muted">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              promoteUser.mutate({
                                id: u.user_id,
                                role: u.role === "admin" ? "student" : "admin",
                              })
                            }
                            title={
                              u.role === "admin"
                                ? "Demote to student"
                                : "Promote to admin"
                            }
                            className="rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {u.role === "admin"
                                ? "person"
                                : "admin_panel_settings"}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete ${u.email}? This cannot be undone.`,
                                )
                              ) {
                                deleteUser.mutate(u.user_id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users?.length === 0 && (
                <p className="py-8 text-center text-text-muted">
                  No users yet.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Questions ─────────────────────────────────────────── */}
      {tab === "questions" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>
              </span>
              <input
                type="text"
                placeholder="Search questions..."
                value={qFilter}
                onChange={(e) => setQFilter(e.target.value)}
                className="h-10 w-72 rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <span className="text-sm text-text-muted">
              {filteredQs?.length ?? 0} questions
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface shadow-sm">
            {loadQs ? (
              <div className="p-6 text-center text-text-muted">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-6 py-3 text-left w-8">#</th>
                      <th className="px-6 py-3 text-left">Question</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Difficulty</th>
                      <th className="px-6 py-3 text-left">Answer</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredQs?.map((q) => (
                      <tr
                        key={q.question_id}
                        className="hover:bg-background transition-colors"
                      >
                        <td className="px-6 py-3 text-xs text-text-muted">
                          {q.question_id}
                        </td>
                        <td className="px-6 py-3 max-w-xs">
                          <p className="line-clamp-2 text-text-main">
                            {q.question_text}
                          </p>
                          {q.options && (
                            <p className="mt-0.5 text-xs text-text-muted">
                              {q.options.slice(0, 3).join(" · ")}
                              {q.options.length > 3 ? "..." : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className="rounded-full bg-border/50 px-2.5 py-1 text-xs font-medium text-text-muted">
                            {TYPE_LABEL[q.question_type] ?? "MCQ"}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                              DIFF_COLOR[q.difficulty],
                            )}
                          >
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-3 max-w-[150px]">
                          <p className="truncate text-xs font-medium text-success">
                            {q.correct_answer}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => {
                              if (confirm("Delete this question?"))
                                deleteQ.mutate(q.question_id);
                            }}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredQs?.length === 0 && (
                  <p className="py-8 text-center text-text-muted">
                    No questions found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
