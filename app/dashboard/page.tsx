"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-background-light font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
      {/* Sidebar */}
      <aside className="z-20 hidden h-full w-72 flex-col justify-between border-r border-slate-200 bg-surface-light p-4 transition-colors duration-300 dark:border-slate-800 dark:bg-surface-dark md:flex">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-2xl text-primary">school</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SmartSikchya</h1>
          </div>
          <nav className="flex flex-col gap-2">
            <a
              className="group flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-white shadow-md shadow-primary/20 transition-all"
              href="#"
            >
              <span className="material-symbols-outlined icon-fill">dashboard</span>
              <span className="font-medium">Dashboard</span>
            </a>
            <a
              className="group flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              href="#"
            >
              <span className="material-symbols-outlined transition-colors group-hover:text-primary">menu_book</span>
              <span className="font-medium">Practice Exam Mode</span>
            </a>
            <a
              className="group flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              href="#"
            >
              <span className="material-symbols-outlined transition-colors group-hover:text-primary">trending_up</span>
              <span className="font-medium">Progress</span>
            </a>
            <a
              className="group flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              href="#"
            >
              <span className="material-symbols-outlined transition-colors group-hover:text-primary">lightbulb</span>
              <span className="font-medium">Recommendations</span>
            </a>
            <a
              className="group flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              href="#"
            >
              <span className="material-symbols-outlined transition-colors group-hover:text-primary">person</span>
              <span className="font-medium">Profile</span>
            </a>
          </nav>
        </div>
        <div className="px-2">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-slate-500 transition-colors hover:text-red-500 dark:text-slate-400">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative flex h-full flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-surface-light px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-surface-dark">
          <div className="flex flex-1 items-center gap-4 lg:gap-8">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 md:hidden"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex h-10 w-full max-w-md items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-slate-700 dark:bg-surface-dark">
              <div className="pl-3 pr-2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="h-full w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white"
                placeholder="Search topics, exams, or chapters..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="relative flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-surface-light bg-red-500 dark:border-surface-dark"></span>
              </button>
              <button className="flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
            <div className="mx-2 h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <button className="group flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full border-2 border-slate-100 bg-cover bg-center shadow-sm dark:border-slate-700"
                style={{
                  backgroundImage:
                    "url(https://lh3.googleusercontent.com/aida-public/AB6AXuA6hJ-8-5y66pt_kfn1T-53_BEuLoemuSl2C_HdYCufrduAeLbTvg9Q7fRbx63p5PFzxtGG9wdhFZBTy-7-knyYO27u2bNRGIuAhqYSpoWxzoFT7BIroN00dLHekS0GAHlsvWwOMWjiAtHrWfRmJpZeQ2Lim8V7Uzxeo5KzS542jQNqYeBYm0GoCp7OSRKs86EQ5MZbPqouGv9_Df-Eh0QmmyK5u-AJ_CUw9lR8BXwdS0c8p9OLltDPc9LV3PWspP6YHxIXFju3Lnc)",
                }}
              ></div>
              <div className="hidden flex-col items-start lg:flex">
                <span className="text-sm font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">
                  Alex Morgan
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Student</span>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
            {/* Welcome Section */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                <div className="group relative flex-[2] overflow-hidden rounded-xl border border-slate-100 bg-surface-light p-6 shadow-sm dark:border-slate-800 dark:bg-surface-dark md:p-8">
                  <div className="relative z-10 flex max-w-xl flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                        Welcome, Alex!
                      </h2>
                      <p className="text-base text-slate-500 dark:text-slate-400 md:text-lg">
                        You've completed <span className="font-bold text-primary">40%</span> of the Physics syllabus.
                        Keep it up!
                      </p>
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex items-end justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Overall Completion
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">40%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                          style={{ width: "40%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                        <span>Continue Physics</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </Button>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 z-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent"></div>
                  <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
                </div>

                <div className="flex flex-1 flex-col justify-between rounded-xl border border-slate-100 bg-surface-light p-6 shadow-sm dark:border-slate-800 dark:bg-surface-dark">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Weekly Activity</h3>
                    <span className="material-symbols-outlined text-slate-400">bar_chart</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative size-24 shrink-0">
                      <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                        <circle
                          className="stroke-current text-slate-100 dark:text-slate-700"
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
                        <span className="text-xl font-bold text-slate-900 dark:text-white">12</span>
                        <span className="text-[10px] uppercase text-slate-500">Hrs</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Questions</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">142</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Accuracy</span>
                        <span className="text-lg font-bold text-green-600">88%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-100 bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-surface-dark">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <span className="material-symbols-outlined">play_circle</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Start Practice</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Jump into a quick 10-question set to keep your streak alive.
                    </p>
                  </div>
                  <div className="mt-auto pt-2">
                    <span className="flex items-center gap-1 text-sm font-bold text-primary transition-all group-hover:gap-2">
                      Start Now <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>

                <div className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-100 bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-surface-dark">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-900/20 dark:text-purple-400">
                      <span className="material-symbols-outlined">quiz</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Take Exam</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Ready for the real deal? Simulate a full-length timed test.
                    </p>
                  </div>
                  <div className="mt-auto pt-2">
                    <span className="flex items-center gap-1 text-sm font-bold text-purple-600 transition-all group-hover:gap-2 dark:text-purple-400">
                      View Exams <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>

                <div className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-100 bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-surface-dark">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/20 dark:text-blue-400">
                      <span className="material-symbols-outlined">monitoring</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">My Progress</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
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
              <div className="flex flex-col rounded-xl border border-slate-100 bg-surface-light shadow-sm dark:border-slate-800 dark:bg-surface-dark lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                  <button className="text-sm font-medium text-primary hover:underline">View All</button>
                </div>
                <div className="flex flex-col p-2">
                  <div className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="shrink-0 rounded-lg bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Completed Calculus I Quiz</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Score: 8/10 • Mathematics</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">2h ago</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="shrink-0 rounded-lg bg-orange-100 p-2 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                      <span className="material-symbols-outlined">bookmark</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bookmarked 'Thermodynamics'</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Chapter 4 • Physics</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">5h ago</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <span className="material-symbols-outlined">play_lesson</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Watched Lecture: Intro to Biology
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Video Lesson • Biology</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">1d ago</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-surface-light p-6 shadow-sm dark:border-slate-800 dark:bg-surface-dark">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Focus Area</h3>
                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      Needs Review
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div
                      className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-200 bg-cover bg-center dark:bg-slate-800"
                      style={{
                        backgroundImage:
                          "url(https://lh3.googleusercontent.com/aida-public/AB6AXuBzkP4lzm2lxG1UgFPjdjIcIiKRMpnIBOpV8J5-pCVofDyD38_tywKbyrqC_wuNNfUZtCib0ufgEhqkiPz5ImxrF2zYqei8lXdisM146F5T-kcvD0I_BNOezrsYRX5r6QB0xF4z-OIneWprerIEbWMsLKEggqG-ZdjtMDrX3vEwHsf20EjIb2g6zBeMASMvIJxyHSmz1DaXIH7gI4Gi7iaV9IwDJd4476aA2OB7TdzUT8PleKHN6CJPDvsNy-85HjS6H0p30L05I6g)",
                      }}
                    >
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Thermodynamics</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your recent quiz scores in this chapter are below average (55%).
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2 flex w-full items-center justify-center gap-2 border-slate-200 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 bg-transparent"
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
  )
}
