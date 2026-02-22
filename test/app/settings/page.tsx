"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function SettingsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <div className="relative flex h-full flex-1 flex-col overflow-hidden">
                    <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                    <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
                        <div className="mx-auto flex max-w-[800px] flex-col gap-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">
                                    Profile & Settings
                                </h1>
                                <p className="text-text-muted dark:text-gray-400">
                                    Manage your account details and learning preferences.
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">

                                {/* Profile Card */}
                                <div className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark mobile:p-4">
                                    <h2 className="mb-4 text-xl font-bold text-text-main dark:text-white">Profile Details</h2>
                                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                                        <div className="relative">
                                            <Avatar className="h-24 w-24 border-4 border-white shadow-sm dark:border-surface-dark">
                                                <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6hJ-8-5y66pt_kfn1T-53_BEuLoemuSl2C_HdYCufrduAeLbTvg9Q7fRbx63p5PFzxtGG9wdhFZBTy-7-knyYO27u2bNRGIuAhqYSpoWxzoFT7BIroN00dLHekS0GAHlsvWwOMWjiAtHrWfRmJpZeQ2Lim8V7Uzxeo5KzS542jQNqYeBYm0GoCp7OSRKs86EQ5MZbPqouGv9_Df-Eh0QmmyK5u-AJ_CUw9lR8BXwdS0c8p9OLltDPc9LV3PWspP6YHxIXFju3Lnc" alt="Profile" />
                                                <AvatarFallback>AJ</AvatarFallback>
                                            </Avatar>
                                            <button className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-white shadow-sm hover:bg-primary-hover">
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                        </div>
                                        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input id="name" defaultValue="Alex Johnson" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" defaultValue="alex.johnson@example.com" disabled />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="grade">Grade / Level</Label>
                                                <Select defaultValue="undergrad">
                                                    <SelectTrigger id="grade">
                                                        <SelectValue placeholder="Select level" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="highschool">High School</SelectItem>
                                                        <SelectItem value="undergrad">Undergraduate</SelectItem>
                                                        <SelectItem value="postgrad">Postgraduate</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="university">Institution</Label>
                                                <Input id="university" defaultValue="Islington College" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Learning Preferences */}
                                <div className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark mobile:p-4">
                                    <h2 className="mb-4 text-xl font-bold text-text-main dark:text-white">Learning Preferences</h2>
                                    <div className="space-y-6">
                                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Adaptive Learning</Label>
                                                <p className="text-sm text-text-muted dark:text-gray-400">
                                                    Adjust question difficulty based on your performance.
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                            <div className="w-full space-y-2 md:w-1/2">
                                                <Label>Primary Focus Subject</Label>
                                                <Select defaultValue="math">
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select subject" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="math">Mathematics</SelectItem>
                                                        <SelectItem value="physics">Physics</SelectItem>
                                                        <SelectItem value="cs">Computer Science</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-full space-y-2 md:w-1/2">
                                                <Label>Preferred Practice Difficulty</Label>
                                                <Select defaultValue="intermediate">
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select difficulty" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="beginner">Beginner</SelectItem>
                                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                                        <SelectItem value="advanced">Advanced</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark mobile:p-4">
                                    <h2 className="mb-4 text-xl font-bold text-text-main dark:text-white">Notifications</h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="email-digest" className="cursor-pointer font-medium">Weekly Email Digest</Label>
                                            <Switch id="email-digest" defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="reminders" className="cursor-pointer font-medium">Study Reminders</Label>
                                            <Switch id="reminders" defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="promos" className="cursor-pointer font-medium">New Course Announcements</Label>
                                            <Switch id="promos" />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-end gap-4">
                                    <Button variant="outline">Cancel</Button>
                                    <Button className="bg-primary text-white hover:bg-primary-hover">Save Changes</Button>
                                </div>

                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
