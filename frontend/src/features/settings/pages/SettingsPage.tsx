/**
 * SettingsPage — user profile, password change, theme toggle, delete account.
 * Streaks moved to sidebar XP box hover.
 */
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

type Tab = "profile" | "security" | "appearance" | "account";

function TabBtn({
  id,
  current,
  icon,
  label,
  onClick,
}: {
  id: Tab;
  current: Tab;
  icon: string;
  label: string;
  onClick: (id: Tab) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
        id === current
          ? "bg-primary text-white"
          : "text-text-muted hover:bg-border/40 hover:text-text-main",
      )}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [fullName, setFullName] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Theme state (persisted to localStorage)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user?.full_name]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileErr("Name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    setProfileMsg("");
    setProfileErr("");
    try {
      await api.patch("/auth/me", { full_name: fullName.trim() });
      await refreshUser();
      setProfileMsg("Profile updated successfully!");
    } catch {
      setProfileErr("Could not save. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      setPwErr("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwErr("Passwords do not match.");
      return;
    }
    setSavingPw(true);
    setPwMsg("");
    setPwErr("");
    try {
      await api.post("/auth/change-password", {
        current_password: currentPw,
        new_password: newPw,
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg("Password changed successfully!");
    } catch (err: any) {
      setPwErr(err?.response?.data?.detail ?? "Incorrect current password.");
    } finally {
      setSavingPw(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") {
      return;
    }
    setDeletingAccount(true);
    try {
      await api.delete("/auth/me");
      await logout();
    } catch {
      setDeletingAccount(false);
    }
  }

  const pwStrength =
    newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3;
  const pwStrengthConfig = [
    null,
    { label: "Weak", color: "bg-danger", width: "w-1/3" },
    { label: "Fair", color: "bg-warning", width: "w-2/3" },
    { label: "Strong", color: "bg-success", width: "w-full" },
  ];
  const strength = pwStrengthConfig[pwStrength];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-text-muted">
          Manage your account, security, and preferences.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        <TabBtn
          id="profile"
          current={tab}
          icon="person"
          label="Profile"
          onClick={setTab}
        />
        <TabBtn
          id="security"
          current={tab}
          icon="lock"
          label="Password"
          onClick={setTab}
        />
        <TabBtn
          id="appearance"
          current={tab}
          icon="palette"
          label="Appearance"
          onClick={setTab}
        />
        <TabBtn
          id="account"
          current={tab}
          icon="manage_accounts"
          label="Account"
          onClick={setTab}
        />
      </div>

      {/* ── PROFILE TAB ────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-5 font-bold text-text-main">Profile Information</h2>

          {/* Avatar display */}
          <div className="mb-6 flex items-center gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="size-20 rounded-full object-cover ring-4 ring-border"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-black text-primary">
                {user?.full_name?.charAt(0).toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <p className="font-bold text-text-main">
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

          <form onSubmit={saveProfile} className="flex flex-col gap-4">
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
                  required
                  className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

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
                  value={user?.email ?? ""}
                  disabled
                  type="email"
                  className="h-12 w-full cursor-not-allowed rounded-xl border border-border bg-border/20 pl-10 pr-4 text-sm text-text-muted"
                />
              </div>
              <p className="text-xs text-text-muted">
                Email cannot be changed.
              </p>
            </div>

            {/* XP summary */}
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

            {profileMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                <span className="material-symbols-outlined icon-fill">
                  check_circle
                </span>
                {profileMsg}
              </div>
            )}
            {profileErr && (
              <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                <span className="material-symbols-outlined">error</span>
                {profileErr}
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {savingProfile ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">
                    progress_activity
                  </span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    save
                  </span>
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── PASSWORD TAB ───────────────────────────────────── */}
      {tab === "security" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-2 font-bold text-text-main">Change Password</h2>
          <p className="mb-5 text-sm text-text-muted">
            Leave current password blank if you signed up with Google (you don't
            have one).
          </p>

          <form onSubmit={savePassword} className="flex flex-col gap-4">
            {/* Current password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">
                Current password
              </label>
              <div className="flex">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Your current password"
                  className="h-12 flex-1 rounded-l-xl border border-r-0 border-border bg-background px-4 text-sm text-text-main focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="flex items-center justify-center rounded-r-xl border border-border bg-background px-4 text-text-muted hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showCurrent ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">
                New password
              </label>
              <div className="flex">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="h-12 flex-1 rounded-l-xl border border-r-0 border-border bg-background px-4 text-sm text-text-main focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="flex items-center justify-center rounded-r-xl border border-border bg-background px-4 text-text-muted hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showNew ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {strength && (
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        strength.color,
                        strength.width,
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      pwStrength === 1
                        ? "text-danger"
                        : pwStrength === 2
                          ? "text-warning"
                          : "text-success",
                    )}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                placeholder="Re-enter new password"
                className={cn(
                  "h-12 w-full rounded-xl border bg-background px-4 text-sm text-text-main focus:outline-none focus:ring-2",
                  confirmPw && confirmPw !== newPw
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:border-primary focus:ring-primary/20",
                )}
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs text-danger">Passwords do not match</p>
              )}
            </div>

            {pwMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                <span className="material-symbols-outlined icon-fill">
                  check_circle
                </span>
                {pwMsg}
              </div>
            )}
            {pwErr && (
              <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                <span className="material-symbols-outlined">error</span>
                {pwErr}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPw || (!!confirmPw && confirmPw !== newPw)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {savingPw ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">
                    progress_activity
                  </span>
                  Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    lock_reset
                  </span>
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── APPEARANCE TAB ─────────────────────────────────── */}
      {tab === "appearance" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-5 font-bold text-text-main">Appearance</h2>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-text-main">Theme</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Light theme */}
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all",
                  theme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/80",
                )}
              >
                <div className="h-16 w-full rounded-xl bg-white border border-gray-200 flex flex-col gap-1.5 p-2 overflow-hidden">
                  <div className="h-2 w-1/2 rounded bg-gray-200" />
                  <div className="h-1.5 w-3/4 rounded bg-gray-100" />
                  <div className="h-1.5 w-2/3 rounded bg-gray-100" />
                </div>
                <div className="flex items-center gap-2">
                  {theme === "light" && (
                    <span className="material-symbols-outlined text-primary text-sm icon-fill">
                      check_circle
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-sm font-bold",
                      theme === "light" ? "text-primary" : "text-text-muted",
                    )}
                  >
                    Light
                  </span>
                </div>
              </button>

              {/* Dark theme */}
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all",
                  theme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/80",
                )}
              >
                <div className="h-16 w-full rounded-xl bg-gray-900 border border-gray-700 flex flex-col gap-1.5 p-2 overflow-hidden">
                  <div className="h-2 w-1/2 rounded bg-gray-600" />
                  <div className="h-1.5 w-3/4 rounded bg-gray-700" />
                  <div className="h-1.5 w-2/3 rounded bg-gray-700" />
                </div>
                <div className="flex items-center gap-2">
                  {theme === "dark" && (
                    <span className="material-symbols-outlined text-primary text-sm icon-fill">
                      check_circle
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-sm font-bold",
                      theme === "dark" ? "text-primary" : "text-text-muted",
                    )}
                  >
                    Dark
                  </span>
                </div>
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Theme preference is saved to your browser.
            </p>
          </div>
        </div>
      )}

      {/* ── ACCOUNT TAB ────────────────────────────────────── */}
      {tab === "account" && (
        <div className="flex flex-col gap-4">
          {/* Account info */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-text-main">Account Details</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Account type</span>
                <span className="font-semibold capitalize text-text-main">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Member since</span>
                <span className="font-semibold text-text-main">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-danger/30 bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-danger">
                warning
              </span>
              <h2 className="font-bold text-danger">Danger Zone</h2>
            </div>
            <p className="mb-4 text-sm text-text-muted">
              Permanently delete your account and all your data. This action
              cannot be undone. All your XP, progress, and sessions will be
              lost.
            </p>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-text-main">
                Type <span className="font-mono text-danger">DELETE</span> to
                confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE here"
                className="h-12 w-full rounded-xl border border-danger/30 bg-background px-4 text-sm text-text-main focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
              />
              <button
                onClick={deleteAccount}
                disabled={deleteConfirm !== "DELETE" || deletingAccount}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-danger text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-danger/90 transition-colors"
              >
                {deletingAccount ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">
                      progress_activity
                    </span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      delete_forever
                    </span>
                    Delete My Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
