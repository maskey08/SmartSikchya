"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function PracticePage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState<string>("")

    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <div className="relative flex h-full flex-1 flex-col overflow-hidden">
                    <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                    <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
                        <div className="mx-auto flex max-w-[1000px] flex-col gap-6">

                            {/* Breadcrumb & Meta */}
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div className="flex items-center gap-2 text-sm text-text-muted dark:text-gray-400">
                                    <span>Mathematics</span>
                                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                                    <span>Algebra</span>
                                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                                    <span className="font-semibold text-primary">Linear Equations</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 rounded-full bg-surface-light px-3 py-1 shadow-sm dark:bg-surface-dark">
                                        <span className="material-symbols-outlined text-sm text-text-muted">timer</span>
                                        <span className="text-sm font-bold tabular-nums">04:30</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full bg-surface-light px-3 py-1 shadow-sm dark:bg-surface-dark">
                                        <span className="material-symbols-outlined text-sm text-text-muted">pause</span>
                                    </div>
                                    <Button variant="destructive" size="sm" className="h-8">Exit</Button>
                                </div>
                            </div>

                            {/* Question Card */}
                            <div className="relative flex flex-col gap-8 rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark md:p-10">

                                {/* Progress Header */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-text-muted">Question 5 of 20</span>
                                        <span className="text-primary">30% Completed</span>
                                    </div>
                                    <Progress value={30} className="h-2" />
                                </div>

                                {/* Problem Statement */}
                                <div className="flex flex-col gap-4">
                                    <span className="text-sm font-bold uppercase tracking-wider text-text-muted">Problem Statement</span>
                                    <h2 className="text-2xl font-bold leading-tight text-text-main dark:text-white md:text-3xl">
                                        Solve for x: 2x + 5 = 15
                                    </h2>
                                    <p className="text-base text-text-muted dark:text-gray-400">
                                        Select the correct value for x from the options below to balance the equation.
                                    </p>
                                </div>

                                {/* Options */}
                                <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "A" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                        <RadioGroupItem value="A" id="opt-a" className="mr-3" />
                                        <Label htmlFor="opt-a" className="flex-1 cursor-pointer font-medium">A. 5</Label>
                                    </div>
                                    <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "B" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                        <RadioGroupItem value="B" id="opt-b" className="mr-3" />
                                        <Label htmlFor="opt-b" className="flex-1 cursor-pointer font-medium">B. 10</Label>
                                    </div>
                                    <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "C" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                        <RadioGroupItem value="C" id="opt-c" className="mr-3" />
                                        <Label htmlFor="opt-c" className="flex-1 cursor-pointer font-medium">C. 2.5</Label>
                                    </div>
                                    <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "D" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                        <RadioGroupItem value="D" id="opt-d" className="mr-3" />
                                        <Label htmlFor="opt-d" className="flex-1 cursor-pointer font-medium">D. 7</Label>
                                    </div>
                                </RadioGroup>

                                {/* Actions */}
                                <div className="mt-4 flex items-center justify-between border-t border-border-light pt-6 dark:border-border-dark">
                                    <Button variant="ghost" className="text-text-muted hover:text-text-main dark:text-gray-400 dark:hover:text-white">
                                        Skip for now
                                    </Button>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-2">
                                            {/* Pagination dots (simplified) */}
                                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                                            <div className="h-2 w-2 rounded-full bg-border-light dark:bg-gray-700"></div>
                                            <div className="h-2 w-2 rounded-full bg-border-light dark:bg-gray-700"></div>
                                        </div>
                                    </div>
                                    <Button className="g-primary bg-primary text-white hover:bg-primary-hover px-8">
                                        Submit Answer
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
