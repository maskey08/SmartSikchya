/**
 * SettingsPage — profile management + streak display + preferences.
 *
 * WHY show streaks here and not just the sidebar?
 * Settings page is where users reflect on their account and habits.
 * Showing streak history here motivates consistent usage and provides
 * context (streak milestones, longest streak record) that wouldn't
 * fit in the sidebar pill.
 */
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────
interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

// ── Streak flame component ─────────────────────────────────────
function StreakFlame({
  count,
  label,
  active,
}: {
  count: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border p-5",
        active ? "border-warning/30 bg-warning/5" : "border-border bg-surface",
      )}
    >
      <span
        className={cn(
          "material-symbols-outlined text-4xl icon-fill",
          active && count > 0 ? "text-warning" : "text-text-muted",
        )}
      >
        {count > 0 ? "local_fire_department" : "water_drop"}
      </span>
      <p
        className={cn(
          "text-3xl font-black",
          active && count > 0 ? "text-warning" : "text-text-main",
        )}
      >
        {count}
      </p>
      <p className="text-xs font-semibold text-text-muted text-center">
        {label}
      </p>
    </div>
  );
}

// ── Streak calendar — shows last 7 days ────────────────────────
function StreakCalendar({ lastActiveDate }: { lastActiveDate: string | null }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  // Determine which days are "active" — simplified: today if last_active_date is today
  // In a full implementation you'd fetch session dates from the DB
  const lastActive = lastActiveDate ? new Date(lastActiveDate) : null;

  return (
    <div className="flex gap-2">
      {days.map((day, i) => {
        const isToday = day.toDateString() === today.toDateString();
        const isActive =
          lastActive && day.toDateString() === lastActive.toDateString();
        const dayLabel = day
          .toLocaleDateString("en", { weekday: "short" })
          .charAt(0);

        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg text-xs font-bold transition-all",
                isActive && "bg-warning text-white",
                isToday && !isActive && "border-2 border-primary text-primary",
                !isActive && !isToday && "bg-border/30 text-text-muted",
              )}
            >
              {isActive ? (
                <span className="material-symbols-outlined text-sm icon-fill">
                  local_fire_department
                </span>
              ) : (
                day.getDate()
              )}
            </div>
            <span className="text-[10px] text-text-muted">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  // Form state
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  // Update form when user loads
  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user?.full_name]);

  // Fetch streak data
  const { data: streak } = useQuery<StreakData>({
    queryKey: ["streak-me"],
    queryFn: () => api.get("/progress/streak").then((r) => r.data),
    // If endpoint not ready yet, return defaults
    retry: false,
  });

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    setSaveError("");
    try {
      await api.patch("/auth/me", { full_name: fullName });
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      setSaveMsg("Profile updated successfully!");
    } catch {
      setSaveError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const streakData: StreakData = streak ?? {
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
  };

  // Streak milestone messages
  const streakMessage =
    streakData.current_streak === 0
      ? "Start a session today to begin your streak!"
      : streakData.current_streak >= 30
        ? "🔥 Incredible! 30+ day streak!"
        : streakData.current_streak >= 14
          ? "🏆 Two weeks strong!"
          : streakData.current_streak >= 7
            ? "⭐ One week streak! Keep going!"
            : streakData.current_streak >= 3
              ? "💪 Great momentum! Don't stop now!"
              : "You've started — keep it going!";

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-text-muted">
          Manage your profile, view your streak, and account details.
        </p>
      </div>

      {/* ── STREAK SECTION ──────────────────────────────────── */}
      {/*
        WHY show streaks in Settings and not a dedicated page?
        A dedicated streaks page would feel thin — there's not enough
        content to justify navigation. Settings is where users reflect
        on their account anyway, so streaks fit naturally here.
        The sidebar XP pill is the "always-on" reminder; Settings is
        the "deep dive" view.
      */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
            <span className="material-symbols-outlined text-warning icon-fill">
              local_fire_department
            </span>
          </div>
          <div>
            <h2 className="font-bold text-text-main">Learning Streak</h2>
            <p className="text-sm text-text-muted">
              Practice every day to build your streak.
            </p>
          </div>
        </div>

        {/* Streak stats */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          <StreakFlame
            count={streakData.current_streak}
            label="Current streak (days)"
            active
          />
          <StreakFlame
            count={streakData.longest_streak}
            label="Longest streak (days)"
          />
        </div>

        {/* Message */}
        <div
          className={cn(
            "mb-5 rounded-xl border px-4 py-3 text-sm font-medium",
            streakData.current_streak > 0
              ? "border-warning/20 bg-warning/5 text-warning"
              : "border-border bg-background text-text-muted",
          )}
        >
          {streakMessage}
        </div>

        {/* Last 7 days calendar */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Last 7 Days
          </p>
          <StreakCalendar lastActiveDate={streakData.last_active_date} />
        </div>

        {/* Tips */}
        {streakData.current_streak === 0 && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
              How streaks work
            </p>
            <p className="text-sm text-text-muted">
              Complete at least one practice session or exam per day to maintain
              your streak. Missing a day resets your streak to zero — but your
              longest streak record is saved!
            </p>
          </div>
        )}
      </div>

      {/* ── PROFILE SECTION ────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-5 font-bold text-text-main">Profile Information</h2>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="size-16 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-black text-primary">
                {user?.full_name?.charAt(0).toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <p className="font-semibold text-text-main">
                {user?.full_name ?? "Student"}
              </p>
              <p className="text-sm text-text-muted">{user?.email}</p>
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold capitalize",
                  user?.role === "admin"
                    ? "bg-primary/10 text-primary"
                    : "bg-border text-text-muted",
                )}
              >
                {user?.role}
              </span>
            </div>
          </div>

          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">
              Full name
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
                <span className="material-symbols-outlined text-[18px]">
                  person
                </span>
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Email — read only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">
              Email address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
                <span className="material-symbols-outlined text-[18px]">
                  mail
                </span>
              </span>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="h-12 w-full rounded-xl border border-border bg-border/20 pl-10 pr-4 text-sm text-text-muted cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-text-muted">
              Email cannot be changed after registration.
            </p>
          </div>

          {/* XP + Level summary */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-background p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-warning icon-fill">
                stars
              </span>
              <div>
                <p className="font-black text-warning">
                  {user?.total_xp ?? 0} XP
                </p>
                <p className="text-xs text-text-muted">Total earned</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500 icon-fill">
                military_tech
              </span>
              <div>
                <p className="font-black text-text-main">
                  Level {user?.level ?? 1}
                </p>
                <p className="text-xs text-text-muted">
                  {500 - ((user?.total_xp ?? 0) % 500)} XP to next
                </p>
              </div>
            </div>
          </div>

          {/* Save feedback */}
          {saveMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
              <span className="material-symbols-outlined icon-fill">
                check_circle
              </span>
              {saveMsg}
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span className="material-symbols-outlined">error</span>
              {saveError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">
                  progress_activity
                </span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── DANGER ZONE ────────────────────────────────────── */}
      <div className="rounded-2xl border border-danger/20 bg-surface p-6 shadow-sm">
        <h2 className="mb-2 font-bold text-text-main">Account Actions</h2>
        <p className="mb-4 text-sm text-text-muted">
          Manage your session and account.
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl border border-danger/30 px-5 py-2.5 text-sm font-bold text-danger transition-colors hover:bg-danger/5"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Log out of all devices
        </button>
      </div>
    </div>
  );
}
