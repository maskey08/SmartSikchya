"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

interface SidebarProps {
  isSidebarOpen?: boolean
  setIsSidebarOpen?: (open: boolean) => void
}

export function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const navLinks = [
    { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { href: "/subjects", icon: "menu_book", label: "Subjects" },
    { href: "/practice", icon: "quiz", label: "Practice Mode" },
    { href: "/analytics", icon: "trending_up", label: "Progress" },
    { href: "/recommendations", icon: "lightbulb", label: "Recommendations" },
    { href: "/settings", icon: "settings", label: "Settings" },
  ]

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full w-72 flex-col justify-between border-r border-border-light bg-surface-light p-4 transition-transform duration-300 dark:border-border-dark dark:bg-surface-dark",
          // Desktop: always visible as a normal element
          "md:relative md:translate-x-0 md:flex",
          // Mobile: slide in/out
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col gap-8">
          {/* Logo - links to dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-2"
            onClick={() => setIsSidebarOpen?.(false)}
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-2xl text-primary">school</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-main dark:text-white">
              SmartSikchya
            </h1>
          </Link>

          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsSidebarOpen?.(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                  isActive(link.href)
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-text-muted hover:bg-background-light dark:text-gray-400 dark:hover:bg-gray-800"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined transition-colors group-hover:text-primary",
                    isActive(link.href) && "icon-fill text-white group-hover:text-white"
                  )}
                >
                  {link.icon}
                </span>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="px-2">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-lg px-4 py-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-bold text-text-main dark:text-white">
                  {user.name}
                </span>
                <span className="truncate text-xs text-text-muted dark:text-gray-400">
                  {user.email}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-text-muted transition-colors hover:text-red-500 dark:text-gray-400"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
