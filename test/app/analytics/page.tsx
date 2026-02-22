"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"

export default function AnalyticsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Mock Data
    const performanceData = [
        { name: 'Mon', accuracy: 65 },
        { name: 'Tue', accuracy: 72 },
        { name: 'Wed', accuracy: 68 },
        { name: 'Thu', accuracy: 85 },
        { name: 'Fri', accuracy: 82 },
        { name: 'Sat', accuracy: 90 },
        { name: 'Sun', accuracy: 88 },
    ]

    const difficultyData = [
        { name: 'Easy', value: 45, color: '#22c55e' },
        { name: 'Medium', value: 30, color: '#eab308' },
        { name: 'Hard', value: 25, color: '#ef4444' },
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
                                    Progress & Analytics
                                </h1>
                                <p className="text-text-muted dark:text-gray-400">
                                    Deep dive into your learning statistics and performance metrics.
                                </p>
                            </div>

                            {/* Key Metrics Cards */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <Card className="bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-text-muted">Average Accuracy</CardTitle>
                                        <span className="material-symbols-outlined text-text-muted">target</span>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">78.5%</div>
                                        <p className="text-xs text-text-muted">+2.5% from last week</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-text-muted">Questions Solved</CardTitle>
                                        <span className="material-symbols-outlined text-text-muted">checklist</span>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">1,245</div>
                                        <p className="text-xs text-text-muted">Top 10% of students</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-text-muted">Study Hours</CardTitle>
                                        <span className="material-symbols-outlined text-text-muted">schedule</span>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">24h 30m</div>
                                        <p className="text-xs text-text-muted">Last 30 days</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Line Chart */}
                                <Card className="bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark col-span-1">
                                    <CardHeader>
                                        <CardTitle>Accuracy Over Time</CardTitle>
                                        <CardDescription>Your performance trend for the last 7 days.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={performanceData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--surface-light)', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                                />
                                                <Line type="monotone" dataKey="accuracy" stroke="var(--primary-custom)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-custom)' }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Donut Chart */}
                                <Card className="bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark col-span-1">
                                    <CardHeader>
                                        <CardTitle>Success Rate by Difficulty</CardTitle>
                                        <CardDescription>Distribution of correct answers across difficulty levels.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={difficultyData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {difficultyData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Areas for Improvement */}
                            <Card className="bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark">
                                <CardHeader>
                                    <CardTitle>Areas for Improvement</CardTitle>
                                    <CardDescription>Topics where your accuracy is below 60%.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between rounded-lg bg-background-light p-4 dark:bg-background-dark">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                <span className="material-symbols-outlined text-lg">warning</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-main dark:text-white">Trigonometric Identities</h4>
                                                <p className="text-xs text-text-muted">Mathematics • 45% Accuracy</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">Practice</Button>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-background-light p-4 dark:bg-background-dark">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                <span className="material-symbols-outlined text-lg">warning</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-main dark:text-white">Advanced Mechanics</h4>
                                                <p className="text-xs text-text-muted">Physics • 52% Accuracy</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">Practice</Button>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
