"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export function Header({
    isSidebarOpen,
    setIsSidebarOpen,
}: {
    isSidebarOpen?: boolean
    setIsSidebarOpen?: (open: boolean) => void
}) {
    const { user } = useAuth()
    const router = useRouter()

    return (
        <header className="z-10 flex shrink-0 items-center justify-between border-b border-border-light bg-surface-light px-6 py-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
            <div className="flex flex-1 items-center gap-4 lg:gap-8">
                {/* Hamburger – mobile only */}
                <button
                    onClick={() => setIsSidebarOpen?.(!isSidebarOpen)}
                    className="flex items-center justify-center rounded-lg p-2 text-text-muted transition-colors hover:bg-background-light dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
                    aria-label="Toggle sidebar"
                >
                    <span className="material-symbols-outlined">
                        {isSidebarOpen ? "close" : "menu"}
                    </span>
                </button>

                {/* Search */}
                <div className="flex h-10 w-full max-w-md items-center overflow-hidden rounded-lg border border-border-light bg-white shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-border-dark dark:bg-surface-dark">
                    <div className="pl-3 pr-2 text-text-muted">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </div>
                    <input
                        className="h-full w-full border-none bg-transparent text-sm text-text-main placeholder:text-text-muted focus:ring-0 dark:text-white"
                        placeholder="Search topics, exams, or chapters..."
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative flex size-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-light dark:text-gray-300 dark:hover:bg-gray-800">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-surface-light bg-red-500 dark:border-surface-dark"></span>
                    </button>

                    {/* Settings icon → /settings */}
                    <Link
                        href="/settings"
                        className="flex size-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-light dark:text-gray-300 dark:hover:bg-gray-800"
                        title="Settings"
                    >
                        <span className="material-symbols-outlined">settings</span>
                    </Link>
                </div>

                <div className="mx-2 h-8 w-[1px] bg-border-light dark:bg-border-dark"></div>

                {/* Profile avatar → /settings (Profile & Settings page) */}
                <Link href="/settings" className="group flex items-center gap-3">
                    {user?.picture ? (
                        <img
                            src={user.picture}
                            alt={user.name}
                            className="h-10 w-10 rounded-full border-2 border-surface-light object-cover shadow-sm dark:border-border-dark"
                        />
                    ) : (
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-light bg-primary/10 text-primary shadow-sm dark:border-border-dark"
                        >
                            <span className="text-sm font-bold">
                                {user?.name?.charAt(0).toUpperCase() ?? "U"}
                            </span>
                        </div>
                    )}
                    <div className="hidden flex-col items-start lg:flex">
                        <span className="text-sm font-bold text-text-main transition-colors group-hover:text-primary dark:text-white">
                            {user?.name ?? "User"}
                        </span>
                        <span className="text-xs text-text-muted dark:text-gray-400">Student</span>
                    </div>
                </Link>
            </div>
        </header>
    )
}
