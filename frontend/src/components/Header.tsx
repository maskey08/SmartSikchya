import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="z-10 flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setIsSidebarOpen?.(!isSidebarOpen)}
          className="flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-border/40 md:hidden"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined">
            {isSidebarOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Search */}
        <div className="flex h-10 w-full max-w-md items-center overflow-hidden rounded-lg border border-border bg-background shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <div className="pl-3 pr-2 text-text-muted">
            <span className="material-symbols-outlined text-[20px]">
              search
            </span>
          </div>
          <input
            className="h-full w-full border-none bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none"
            placeholder="Search topics, chapters..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex size-10 items-center justify-center rounded-full text-text-muted hover:bg-border/40">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-surface bg-danger" />
        </button>

        <div className="mx-1 h-8 w-px bg-border" />

        {/* Avatar → /settings */}
        <Link to="/settings" className="group flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name ?? "User"}
              className="h-10 w-10 rounded-full border-2 border-surface object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
              <span className="text-sm font-bold">
                {user?.full_name?.charAt(0).toUpperCase() ?? "U"}
              </span>
            </div>
          )}
          <div className="hidden flex-col lg:flex">
            <span className="text-sm font-bold text-text-main group-hover:text-primary">
              {user?.full_name ?? "User"}
            </span>
            <span className="text-xs text-text-muted">Student</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
