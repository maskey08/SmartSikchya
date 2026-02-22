"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

export default function ExamPage() {
    const [selectedOption, setSelectedOption] = useState<string>("")
    const [markedForReview, setMarkedForReview] = useState(false)

    // Mock Question Navigator Data
    const questionStatus = Array.from({ length: 30 }, (_, i) => {
        if (i === 0 || i === 1 || i === 2) return "answered"
        if (i === 4) return "marked"
        if (i === 10) return "current"
        return "unanswered"
    })

    return (
        <div className="flex h-screen w-full flex-col bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">

            {/* Exam Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-light bg-surface-light px-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                        <span className="material-symbols-outlined text-primary">school</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold leading-tight">SmartSikchya</h1>
                        <span className="text-xs text-text-muted">Exam Mode</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-surface-light border border-border-light px-4 py-1.5 shadow-sm dark:bg-surface-dark dark:border-border-dark">
                    <span className="material-symbols-outlined text-primary animate-pulse">timer</span>
                    <span className="font-mono text-lg font-bold">44:12</span>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Remaining</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold">Alex Johnson</p>
                        <p className="text-xs text-text-muted">Student ID: 123456</p>
                    </div>
                    <div
                        className="size-9 rounded-full bg-cover bg-center ring-2 ring-white dark:ring-gray-700"
                        style={{
                            backgroundImage:
                                "url(https://lh3.googleusercontent.com/aida-public/AB6AXuA6hJ-8-5y66pt_kfn1T-53_BEuLoemuSl2C_HdYCufrduAeLbTvg9Q7fRbx63p5PFzxtGG9wdhFZBTy-7-knyYO27u2bNRGIuAhqYSpoWxzoFT7BIroN00dLHekS0GAHlsvWwOMWjiAtHrWfRmJpZeQ2Lim8V7Uzxeo5KzS542jQNqYeBYm0GoCp7OSRKs86EQ5MZbPqouGv9_Df-Eh0QmmyK5u-AJ_CUw9lR8BXwdS0c8p9OLltDPc9LV3PWspP6YHxIXFju3Lnc)",
                        }}
                    ></div>
                </div>
            </header>

            {/* Main Exam Area */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Question Navigator */}
                <aside className="hidden w-72 flex-col border-r border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark lg:flex">
                    <div className="flex items-center justify-between border-b border-border-light p-4 dark:border-border-dark">
                        <span className="font-bold">Question Navigator</span>
                        <span className="text-xs text-text-muted">Jump to any question instantly</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-5 gap-3">
                            {questionStatus.map((status, index) => (
                                <button
                                    key={index}
                                    className={`flex aspect-square items-center justify-center rounded-md border text-sm font-medium transition-all
                                ${status === 'current' ? 'border-primary bg-primary text-white shadow-md' : ''}
                                ${status === 'answered' ? 'border-primary/50 bg-primary/10 text-primary' : ''}
                                ${status === 'marked' ? 'border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-900/20' : ''}
                                ${status === 'unanswered' ? 'border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-gray-800' : ''}
                            `}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-border-light p-4 dark:border-border-dark">
                        <div className="flex flex-col gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full border border-primary bg-primary"></div>
                                <span>Current</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full border border-primary/50 bg-primary/10"></div>
                                <span>Answered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full border border-orange-400 bg-orange-50"></div>
                                <span>Marked for Review</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full border border-border-light bg-transparent"></div>
                                <span>Not Visited</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right: Question Content */}
                <main className="flex flex-1 flex-col overflow-y-auto bg-background-light p-4 dark:bg-background-dark md:p-8">
                    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">

                        {/* Meta Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-primary text-primary">ASSESSMENT</Badge>
                                <span className="text-sm font-semibold text-text-muted">Module 4</span>
                            </div>
                            <span className="text-sm font-bold text-text-main dark:text-white">Question 3 of 30</span>
                        </div>

                        <div className="h-[2px] w-full bg-border-light dark:bg-border-dark">
                            <div className="h-full w-[10%] bg-primary"></div>
                        </div>

                        {/* Question Card */}
                        <div className="flex flex-col gap-8 rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark md:p-10">
                            <h2 className="text-3xl font-bold leading-tight text-text-main dark:text-white">
                                Advanced Physics
                            </h2>

                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="text-lg font-medium leading-relaxed">
                                    Q5. According to Newton's Third Law of Motion, for every action, there is an equal and opposite reaction.
                                    Which of the following examples best illustrates this principle in a vacuum environment?
                                </p>
                            </div>

                            {/* Options */}
                            <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="flex flex-col gap-4">
                                <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "A" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                    <RadioGroupItem value="A" id="opt-a" className="mt-0.5" />
                                    <div className="ml-3 flex flex-col">
                                        <Label htmlFor="opt-a" className="cursor-pointer text-base font-medium">A rocket accelerating forward by expelling gas backward.</Label>
                                    </div>
                                </div>
                                <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "B" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                    <RadioGroupItem value="B" id="opt-b" className="mt-0.5" />
                                    <div className="ml-3 flex flex-col">
                                        <Label htmlFor="opt-b" className="cursor-pointer text-base font-medium">A bird flying by pushing air downwards.</Label>
                                    </div>
                                </div>
                                <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "C" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                    <RadioGroupItem value="C" id="opt-c" className="mt-0.5" />
                                    <div className="ml-3 flex flex-col">
                                        <Label htmlFor="opt-c" className="cursor-pointer text-base font-medium">A swimmer pushing against the water to move forward.</Label>
                                    </div>
                                </div>
                                <div className={`flex items-center rounded-lg border p-4 transition-all ${selectedOption === "D" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border-light hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"}`}>
                                    <RadioGroupItem value="D" id="opt-d" className="mt-0.5" />
                                    <div className="ml-3 flex flex-col">
                                        <Label htmlFor="opt-d" className="cursor-pointer text-base font-medium">A ball rolling down a frictionless hill.</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Footer Controls */}
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <Button variant="outline" className="w-full sm:w-auto gap-2">
                                <span className="material-symbols-outlined">arrow_back</span>
                                Previous
                            </Button>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="review"
                                    checked={markedForReview}
                                    onCheckedChange={(c) => setMarkedForReview(!!c)}
                                />
                                <Label htmlFor="review" className="cursor-pointer font-medium text-text-muted">Mark for Review</Label>
                            </div>

                            <Button className="w-full bg-primary text-white hover:bg-primary-hover sm:w-auto gap-2">
                                Next
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </Button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    )
}
