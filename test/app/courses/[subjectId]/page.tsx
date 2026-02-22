"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/ProtectedRoute"

const subjectsData: Record<
    string,
    {
        title: string
        icon: string
        color: string
        description: string
        chapters: {
            id: number
            title: string
            lessons: number
            progress: number
            locked: boolean
        }[]
    }
> = {
    math: {
        title: "Mathematics",
        icon: "calculate",
        color: "text-blue-600",
        description: "Master algebra, calculus, and everything in between.",
        chapters: [
            { id: 1, title: "Functions & Limits", lessons: 12, progress: 80, locked: false },
            { id: 2, title: "Derivatives", lessons: 15, progress: 45, locked: false },
            { id: 3, title: "Integrals", lessons: 10, progress: 0, locked: false },
            { id: 4, title: "Differential Equations", lessons: 8, progress: 0, locked: true },
            { id: 5, title: "Sequences & Series", lessons: 14, progress: 0, locked: true },
            { id: 6, title: "Vectors & Geometry", lessons: 9, progress: 0, locked: true },
        ],
    },
    english: {
        title: "English",
        icon: "menu_book",
        color: "text-orange-600",
        description: "Strengthen your reading, writing, and comprehension skills.",
        chapters: [
            { id: 1, title: "Grammar Basics", lessons: 10, progress: 100, locked: false },
            { id: 2, title: "Essay Writing", lessons: 8, progress: 30, locked: false },
            { id: 3, title: "Reading Comprehension", lessons: 12, progress: 0, locked: false },
            { id: 4, title: "Vocabulary Building", lessons: 10, progress: 0, locked: true },
        ],
    },
    physics: {
        title: "Physics",
        icon: "science",
        color: "text-purple-600",
        description: "Explore mechanics, thermodynamics, and modern physics.",
        chapters: [
            { id: 1, title: "Kinematics", lessons: 10, progress: 0, locked: false },
            { id: 2, title: "Newton's Laws", lessons: 12, progress: 0, locked: true },
            { id: 3, title: "Thermodynamics", lessons: 14, progress: 0, locked: true },
            { id: 4, title: "Waves & Optics", lessons: 11, progress: 0, locked: true },
            { id: 5, title: "Electromagnetism", lessons: 13, progress: 0, locked: true },
        ],
    },
}

export default function CoursesBySubjectPage({
    params,
}: {
    params: { subjectId: string }
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const router = useRouter()
    const { subjectId } = params
    const subject = subjectsData[subjectId]

    if (!subject) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-5xl text-text-muted">
                            search_off
                        </span>
                        <h1 className="mt-4 text-2xl font-bold text-text-main dark:text-white">
                            Subject not found
                        </h1>
                        <Link href="/subjects" className="mt-4 inline-block text-primary hover:underline">
                            ← Back to Subjects
                        </Link>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    const overallProgress =
        subject.chapters.length > 0
            ? Math.round(
                subject.chapters.reduce((sum, c) => sum + c.progress, 0) / subject.chapters.length
            )
            : 0

    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <div className="relative flex h-full flex-1 flex-col overflow-hidden">
                    <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                    <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
                        <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
                            {/* Breadcrumb + Header */}
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-sm text-text-muted dark:text-gray-400">
                                        <Link href="/subjects" className="hover:text-primary transition-colors">
                                            Subjects
                                        </Link>
                                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                                        <span className="font-semibold text-primary">{subject.title}</span>
                                    </div>
                                    <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">
                                        {subject.title}
                                    </h1>
                                    <p className="max-w-2xl text-text-muted dark:text-gray-400">
                                        {subject.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-primary">
                                            {overallProgress}% Complete
                                        </span>
                                        <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${overallProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <Button variant="outline" className="gap-2">
                                        <span className="material-symbols-outlined">sort</span>
                                        Sort by: Chapter
                                    </Button>
                                </div>
                            </div>

                            {/* Chapters Grid */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {subject.chapters.map((chapter) => (
                                    <div
                                        key={chapter.id}
                                        className={`group flex flex-col justify-between rounded-xl border bg-surface-light p-6 shadow-sm transition-all dark:bg-surface-dark ${chapter.locked
                                                ? "border-border-light opacity-60 dark:border-border-dark"
                                                : "border-border-light hover:shadow-md dark:border-border-dark"
                                            }`}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-400">
                                                    {String(chapter.id).padStart(2, "0")}
                                                </span>
                                                {chapter.locked && (
                                                    <span className="material-symbols-outlined text-text-muted">lock</span>
                                                )}
                                            </div>

                                            {/* Abstract art placeholder */}
                                            <div className="relative h-24 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-200/50 to-transparent dark:from-gray-900/50" />
                                                <svg
                                                    className="absolute left-1/2 top-1/2 w-3/4 -translate-x-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700"
                                                    viewBox="0 0 100 20"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T100,10" />
                                                </svg>
                                            </div>

                                            <div>
                                                <h3 className="line-clamp-1 text-lg font-bold text-text-main dark:text-white">
                                                    {chapter.title}
                                                </h3>
                                                <p className="text-sm text-text-muted dark:text-gray-400">
                                                    {chapter.lessons} Lessons
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-col gap-3">
                                            <div className="flex justify-between text-xs font-medium text-text-muted dark:text-gray-400">
                                                <span>Progress</span>
                                                <span>{chapter.progress}%</span>
                                            </div>
                                            <Progress value={chapter.progress} className="h-1.5" />
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-full text-xs"
                                                    disabled={chapter.locked}
                                                >
                                                    Practice
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-full text-xs"
                                                    disabled={chapter.locked}
                                                >
                                                    Take Exam
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
