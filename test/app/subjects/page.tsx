"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/context/AuthContext"

export default function SubjectsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

    const subjects = [
        {
            id: "math",
            title: "Mathematics",
            icon: "calculate",
            progress: 45,
            status: "Continued",
            color: "bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-400",
            buttonText: "Continue Learning",
        },
        {
            id: "english",
            title: "English",
            icon: "menu_book",
            progress: 12,
            status: "Continued",
            color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
            buttonText: "Continue Learning",
        },
        {
            id: "physics",
            title: "Physics",
            icon: "science",
            progress: 0,
            status: "Get Started",
            color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
            buttonText: "Start Course",
        },
    ]

    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <div className="relative flex h-full flex-1 flex-col overflow-hidden">
                    <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                    <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
                        <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">
                                    Let's keep learning, {user?.name?.split(" ")[0] ?? "Student"}!
                                </h1>
                                <p className="text-text-muted dark:text-gray-400">
                                    Select a subject to view chapters and continue your progress.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {subjects.map((subject) => (
                                    <div
                                        key={subject.id}
                                        className="group flex flex-col justify-between rounded-xl border border-border-light bg-surface-light p-6 shadow-sm transition-all hover:shadow-md dark:border-border-dark dark:bg-surface-dark"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className={`flex size-12 items-center justify-center rounded-lg ${subject.color}`}
                                                >
                                                    <span className="material-symbols-outlined text-2xl">
                                                        {subject.icon}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-background-light text-text-muted dark:bg-background-dark dark:text-gray-400"
                                                >
                                                    {subject.status}
                                                </Badge>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-text-main dark:text-white">
                                                    {subject.title}
                                                </h3>
                                                <div className="mt-4 flex flex-col gap-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-text-muted dark:text-gray-400">Progress</span>
                                                        <span className="font-bold text-text-main dark:text-white">
                                                            {subject.progress}%
                                                        </span>
                                                    </div>
                                                    <Progress value={subject.progress} className="h-2" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <Button
                                                variant={subject.progress === 0 ? "outline" : "default"}
                                                className={`w-full ${subject.progress === 0
                                                        ? "border-text-main text-text-main hover:bg-background-light dark:border-white dark:text-white dark:hover:bg-gray-800"
                                                        : "bg-primary text-white hover:bg-primary-hover"
                                                    }`}
                                                onClick={() => router.push(`/courses/${subject.id}`)}
                                            >
                                                {subject.buttonText}
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Subject Card */}
                                <button className="group flex h-full min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border-light bg-transparent p-6 transition-all hover:border-primary hover:bg-primary/5 dark:border-border-dark dark:hover:border-primary">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-background-light dark:bg-surface-dark">
                                        <span className="material-symbols-outlined text-3xl text-text-muted transition-colors group-hover:text-primary dark:text-gray-400">
                                            add
                                        </span>
                                    </div>
                                    <span className="font-bold text-text-muted transition-colors group-hover:text-primary dark:text-gray-400">
                                        Browse more subjects
                                    </span>
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
