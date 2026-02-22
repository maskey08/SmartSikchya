"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* Main Content Area */}
        <div className="relative flex h-full flex-1 flex-col overflow-hidden">
          <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
            <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
              {/* Welcome Section */}
              <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                  <div className="group relative flex-[2] overflow-hidden rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark md:p-8">
                    <div className="relative z-10 flex max-w-xl flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">
                          Welcome, Alex!
                        </h2>
                        <p className="text-base text-text-muted dark:text-gray-400 md:text-lg">
                          You've completed <span className="font-bold text-primary">40%</span> of the Physics syllabus.
                          Keep it up!
                        </p>
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="flex items-end justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            Overall Completion
                          </span>
                          <span className="text-sm font-bold text-text-main dark:text-white">40%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-background-light dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: "40%" }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover">
                          <span>Continue Physics</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Button>
                      </div>
                    </div>
                    <div className="absolute right-0 top-0 z-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent"></div>
                    <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-bold text-text-main dark:text-white">Weekly Activity</h3>
                      <span className="material-symbols-outlined text-text-muted">bar_chart</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="relative size-24 shrink-0">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <circle
                            className="stroke-current text-background-light dark:text-gray-700"
                            cx="18"
                            cy="18"
                            fill="none"
                            r="16"
                            strokeWidth="4"
                          ></circle>
                          <circle
                            className="stroke-current text-primary"
                            cx="18"
                            cy="18"
                            fill="none"
                            r="16"
                            strokeDasharray="100"
                            strokeDashoffset="25"
                            strokeLinecap="round"
                            strokeWidth="4"
                          ></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-text-main dark:text-white">12</span>
                          <span className="text-[10px] uppercase text-text-muted">Hrs</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-text-muted dark:text-gray-400">Questions</span>
                          <span className="text-lg font-bold text-text-main dark:text-white">142</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-text-muted dark:text-gray-400">Accuracy</span>
                          <span className="text-lg font-bold text-green-600">88%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h3 className="mb-4 text-lg font-bold text-text-main dark:text-white">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <span className="material-symbols-outlined">play_circle</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-text-main dark:text-white">Start Practice</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400">
                        Jump into a quick 10-question set to keep your streak alive.
                      </p>
                    </div>
                    <div className="mt-auto pt-2">
                      <span className="flex items-center gap-1 text-sm font-bold text-primary transition-all group-hover:gap-2">
                        Start Now <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>

                  <div className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-purple-50 p-3 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-900/20 dark:text-purple-400">
                        <span className="material-symbols-outlined">quiz</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-text-main dark:text-white">Take Exam</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400">
                        Ready for the real deal? Simulate a full-length timed test.
                      </p>
                    </div>
                    <div className="mt-auto pt-2">
                      <span className="flex items-center gap-1 text-sm font-bold text-purple-600 transition-all group-hover:gap-2 dark:text-purple-400">
                        View Exams <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>

                  <div className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/20 dark:text-blue-400">
                        <span className="material-symbols-outlined">monitoring</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-text-main dark:text-white">My Progress</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400">
                        See detailed analytics on your improvement over time.
                      </p>
                    </div>
                    <div className="mt-auto pt-2">
                      <span className="flex items-center gap-1 text-sm font-bold text-blue-600 transition-all group-hover:gap-2 dark:text-blue-400">
                        Check Stats <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity & Focus Area */}
              <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex flex-col rounded-xl border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-border-light p-6 dark:border-border-dark">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Recent Activity</h3>
                    <button className="text-sm font-medium text-primary hover:underline">View All</button>
                  </div>
                  <div className="flex flex-col p-2">
                    <div className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-background-light dark:hover:bg-background-dark/50">
                      <div className="shrink-0 rounded-lg bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-text-main dark:text-white">Completed Calculus I Quiz</h4>
                        <p className="text-xs text-text-muted dark:text-gray-400">Score: 8/10 • Mathematics</p>
                      </div>
                      <span className="text-xs font-medium text-text-muted">2h ago</span>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-background-light dark:hover:bg-background-dark/50">
                      <div className="shrink-0 rounded-lg bg-orange-100 p-2 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                        <span className="material-symbols-outlined">bookmark</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-text-main dark:text-white">Bookmarked 'Thermodynamics'</h4>
                        <p className="text-xs text-text-muted dark:text-gray-400">Chapter 4 • Physics</p>
                      </div>
                      <span className="text-xs font-medium text-text-muted">5h ago</span>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-background-light dark:hover:bg-background-dark/50">
                      <div className="shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <span className="material-symbols-outlined">play_lesson</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-text-main dark:text-white">
                          Watched Lecture: Intro to Biology
                        </h4>
                        <p className="text-xs text-text-muted dark:text-gray-400">Video Lesson • Biology</p>
                      </div>
                      <span className="text-xs font-medium text-text-muted">1d ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-text-main dark:text-white">Focus Area</h3>
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Needs Review
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div
                        className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-200 bg-cover bg-center dark:bg-gray-800"
                        style={{
                          backgroundImage:
                            "url(https://lh3.googleusercontent.com/aida-public/AB6AXuBzkP4lzm2lxG1UgFPjdjIcIiKRMpnIBOpV8J5-pCVofDyD38_tywKbyrqC_wuNNfUZtCib0ufgEhqkiPz5ImxrF2zYqei8lXdisM146F5T-kcvD0I_BNOezrsYRX5r6QB0xF4z-OIneWprerIEbWMsLKEggqG-ZdjtMDrX3vEwHsf20EjIb2g6zBeMASMvIJxyHSmz1DaXIH7gI4Gi7iaV9IwDJd4476aA2OB7TdzUT8PleKHN6CJPDvsNy-85HjS6H0p30L05I6g)",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/20"></div>
                      </div>
                      <h4 className="mt-1 text-base font-bold text-text-main dark:text-white">Thermodynamics</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400">
                        Your recent quiz scores in this chapter are below average (55%).
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-2 flex w-full items-center justify-center gap-2 border-border-light py-2.5 font-medium text-text-main transition-colors hover:bg-background-light dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 bg-transparent"
                    >
                      <span className="material-symbols-outlined text-[18px]">replay</span>
                      Review Chapter
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
