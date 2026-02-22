"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle signup logic here
    console.log("Signup:", formData)
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display antialiased transition-colors duration-200 dark:bg-background-dark">
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border-light bg-surface-light px-6 py-4 dark:border-border-dark dark:bg-surface-dark lg:px-12">
        <div className="flex items-center gap-3 text-text-main dark:text-white">
          <div className="flex size-8 items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">SmartSikchya</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-text-main dark:text-gray-300 sm:inline">Already have an account?</span>
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Log In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4 lg:p-8">
        <div className="flex h-full w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-light shadow-xl dark:border-border-dark dark:bg-surface-dark lg:h-[750px] lg:flex-row">
          {/* Left Side: Form Section */}
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-10 sm:px-12 lg:px-16">
            <div className="mx-auto w-full max-w-[420px]">
              <div className="mb-8 text-center lg:text-left">
                <h1 className="mb-2 text-3xl font-bold text-text-main dark:text-white">Create your account</h1>
                <p className="text-text-sub dark:text-gray-400">Join thousands of students learning effectively.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullname" className="block text-sm font-medium text-text-main dark:text-gray-200">
                    Full Name
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-sub">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </span>
                    <Input
                      id="fullname"
                      name="fullname"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullname}
                      onChange={(e) => updateField("fullname", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-4 text-text-main shadow-sm transition-all placeholder:text-text-sub/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="block text-sm font-medium text-text-main dark:text-gray-200">
                    Email Address
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-sub">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </span>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-4 text-text-main shadow-sm transition-all placeholder:text-text-sub/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="block text-sm font-medium text-text-main dark:text-gray-200">
                    Password
                  </Label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-sub">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </span>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-10 text-text-main shadow-sm transition-all placeholder:text-text-sub/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-text-sub transition-colors hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {/* Strength Meter */}
                  <div className="mt-2 flex h-1 gap-1">
                    <div className="h-full w-1/4 rounded-full bg-red-400"></div>
                    <div className="h-full w-1/4 rounded-full bg-border-light dark:bg-gray-700"></div>
                    <div className="h-full w-1/4 rounded-full bg-border-light dark:bg-gray-700"></div>
                    <div className="h-full w-1/4 rounded-full bg-border-light dark:bg-gray-700"></div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-text-main dark:text-gray-200"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-sub">
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </span>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-10 text-text-main shadow-sm transition-all placeholder:text-text-sub/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-text-sub transition-colors hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <Checkbox
                      id="terms"
                      checked={formData.terms}
                      onCheckedChange={(checked) => updateField("terms", !!checked)}
                      className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <Label htmlFor="terms" className="font-medium text-text-main dark:text-gray-300">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="mt-2 w-full border border-transparent bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Create Account
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-light dark:border-border-dark"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-surface-light px-2 text-text-sub dark:bg-surface-dark">Or continue with</span>
                </div>
              </div>

              {/* Social Sign Up */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2 border-border-light bg-background-light px-3 py-2.5 text-sm font-medium text-text-main transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white dark:hover:bg-gray-800"
                >
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z"
                      fill="#fff"
                      fillOpacity="0"
                    ></path>
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  <span className="truncate">Google</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2 border-border-light bg-background-light px-3 py-2.5 text-sm font-medium text-text-main transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white dark:hover:bg-gray-800"
                >
                  <svg aria-hidden="true" className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      clipRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                  <span className="truncate">Facebook</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side: Visual Section */}
          <div className="group/visual relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-primary p-12 text-center text-white lg:flex">
            {/* Abstract Background Pattern using Gradients */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-20">
              <div className="absolute left-[-20%] top-[-20%] h-[140%] w-[140%] rotate-12 transform rounded-full bg-gradient-to-br from-white via-transparent to-transparent opacity-30 blur-3xl"></div>
              <div className="absolute bottom-[-20%] right-[-20%] h-[100%] w-[100%] rounded-full bg-gradient-to-tl from-teal-900 via-transparent to-transparent opacity-40 blur-3xl"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex max-w-[320px] flex-col items-center gap-8">
              <div className="flex size-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-md">
                <span className="material-symbols-outlined text-4xl text-white">menu_book</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold leading-tight">Start your academic journey today.</h3>
                <p className="text-lg font-light text-white/80">
                  Access premium learning materials, track your progress, and join a community of lifelong learners.
                </p>
              </div>
              <div className="mt-8 grid w-full grid-cols-2 gap-4 text-left">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="material-symbols-outlined mb-2 text-2xl text-teal-200">check_circle</span>
                  <p className="text-sm font-semibold">Expert Content</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="material-symbols-outlined mb-2 text-2xl text-teal-200">groups</span>
                  <p className="text-sm font-semibold">Study Groups</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer for Sign Up Page */}
      <footer className="py-6 text-center text-sm text-text-sub dark:text-gray-500">
        <p>© 2025 SmartSikchya. All rights reserved.</p>
      </footer>
    </div>
  )
}
