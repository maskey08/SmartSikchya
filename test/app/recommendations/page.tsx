"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Badge } from "@/components/ui/badge"

export default function RecommendationsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const recommendations = [
        {
            id: 1,
            title: "Physics: Maintain Momentum",
            reason: "You nailed the last quiz! Keep the streak alive.",
            topic: "Newton's Laws",
            progress: 45,
            type: "in-progress", // in-progress, attention, mastered
            color: "blue",
        },
        {
            id: 2,
            title: "Math: Needs Attention",
            reason: "Accuracy dropped in last practice session.",
            topic: "Integration by Parts",
            progress: 20,
            type: "attention",
            color: "red",
        },
        {
            id: 3,
            title: "CS: Challenge Yourself",
            reason: "You've mastered the basics. Try advanced problems.",
            topic: "Data Structures: Trees",
            progress: 0,
            type: "new",
            color: "purple",
        },
    ]

    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <div className="relative flex h-full flex-1 flex-col overflow-hidden">
                    <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                    <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
                        <div className="mx-auto flex max-w-[1000px] flex-col gap-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">
                                    Your Learning Path
                                </h1>
                                <p className="text-text-muted dark:text-gray-400">
                                    AI-powered recommendations tailored to your performance.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {recommendations.map((item) => (
                                    <div key={item.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border-light bg-surface-light p-6 shadow-sm transition-all hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                                        {item.type === 'attention' && <div className="absolute right-0 top-0 h-16 w-16 translate-x-8 translate-y--8 rotate-45 bg-red-500/10"></div>}

                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className={`rounded-lg p-2 ${item.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    item.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                                    }`}>
                                                    <span className="material-symbols-outlined">
                                                        {item.type === 'attention' ? 'priority_high' : item.type === 'in-progress' ? 'trending_up' : 'star'}
                                                    </span>
                                                </div>
                                                {item.type === 'attention' && <Badge variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-200 border-none dark:bg-red-900/50 dark:text-red-400">Review Needed</Badge>}
                                                {item.type === 'in-progress' && <Badge variant="secondary" className="bg-blue-100 text-blue-600 hover:bg-blue-200 border-none dark:bg-blue-900/50 dark:text-blue-400">On Track</Badge>}
                                                {item.type === 'new' && <Badge variant="secondary" className="bg-purple-100 text-purple-600 hover:bg-purple-200 border-none dark:bg-purple-900/50 dark:text-purple-400">Recommended</Badge>}
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-text-main dark:text-white">{item.title}</h3>
                                                <p className="mt-1 text-sm text-text-muted dark:text-gray-400">{item.reason}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-col gap-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-text-muted">{item.topic}</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <Progress value={item.progress} className="h-1.5" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button size="sm" variant="outline">Analytics</Button>
                                                <Button size="sm" className="bg-primary text-white hover:bg-primary-hover">
                                                    {item.type === 'attention' ? 'Review' : 'Continue'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Suggested Practice */}
                            <div className="flex flex-col gap-4">
                                <h2 className="text-xl font-bold text-text-main dark:text-white">Suggested Practice Sets</h2>
                                <div className="divide-y divide-border-light rounded-xl border border-border-light bg-surface-light dark:divide-border-dark dark:border-border-dark dark:bg-surface-dark">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-4 transition-colors hover:bg-background-light dark:hover:bg-background-dark/50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex size-10 items-center justify-center rounded-lg bg-background-light dark:bg-background-dark">
                                                    <span className="material-symbols-outlined text-text-muted">assignment</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-text-main dark:text-white">Calculus: Mixed Derivatives</h4>
                                                    <p className="text-xs text-text-muted">15 Questions • Medium • 20 min</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="text-primary hover:text-primary-hover hover:bg-primary/5">
                                                Start
                                                <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
