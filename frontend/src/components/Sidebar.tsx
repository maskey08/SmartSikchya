import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

const studentLinks = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/subjects", icon: "menu_book", label: "Subjects" },
  { to: "/practice", icon: "quiz", label: "Practice" },
  { to: "/progress", icon: "trending_up", label: "Progress" },
  { to: "/recommendations", icon: "lightbulb", label: "For You" },
  { to: "/settings", icon: "settings", label: "Settings" },
];

const adminLinks = [
  { to: "/admin", icon: "admin_panel_settings", label: "Admin Dashboard" },
  { to: "/dashboard", icon: "dashboard", label: "Student View" },
  { to: "/subjects", icon: "menu_book", label: "Subjects" },
  { to: "/settings", icon: "settings", label: "Settings" },
];

export function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const { pathname } = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const links = isAdmin ? adminLinks : studentLinks;

  const isActive = (to: string) =>
    to === "/dashboard"
      ? pathname === to
      : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen?.(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col justify-between border-r border-border bg-surface p-4 transition-transform duration-300",
          "md:relative md:translate-x-0 md:flex",
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex flex-col gap-6">
          <Link
            to={isAdmin ? "/admin" : "/dashboard"}
            className="flex items-center gap-3 px-2 py-1"
            onClick={() => setIsSidebarOpen?.(false)}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">
                school
              </span>
            </div>
            <div>
              <span className="text-base font-bold text-text-main">
                SmartSikshya
              </span>
              {isAdmin && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Admin
                </span>
              )}
            </div>
          </Link>

          {/* XP bar (students only) */}
          {!isAdmin && user && (
            <div className="mx-2 rounded-xl bg-background p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-bold text-warning">
                  <span className="material-symbols-outlined text-[14px] icon-fill">
                    stars
                  </span>
                  {user.total_xp} XP
                </span>
                <span className="text-text-muted">Level {user.level}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-warning transition-all duration-700"
                  style={{ width: `${(user.total_xp % 500) / 5}%` }}
                />
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsSidebarOpen?.(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive(link.to)
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "text-text-muted hover:bg-border/40 hover:text-text-main",
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[20px]",
                    isActive(link.to) ? "icon-fill" : "",
                  )}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User + logout */}
        <div className="border-t border-border pt-4">
          {user && (
            <div className="mb-3 flex items-center gap-2.5 px-2">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {user.full_name?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-text-main">
                  {user.full_name ?? "Student"}
                </p>
                <p className="truncate text-[10px] text-text-muted">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-danger/5 hover:text-danger"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
