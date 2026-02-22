"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log("Login:", { email, password })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-text-main antialiased dark:bg-background-dark dark:text-white">
      {/* Left Section: Visual/Brand */}
      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 z-10 h-full w-full bg-primary/10 dark:bg-primary/5"></div>
        <img
          alt="University campus library interior with calm lighting"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEjx-g52YQ42ZnLcTUi8zdl1AyWdRC-vrXnjJ4103je_IfasB_TKy2c57pLQpCI48YpeWNrc3JphY5eGQNrDQvKU4MbWARedPdgyClxQ_tXvqjqCEn4HNjVehzNf0qLzGy5fs9VJi0-tActHTxD605mgKNpPNO9NAMf0sRbzr_pje-FGgDpK3DI5WZpP-BrZXopfcsUUS5pHuIVgH0L4M0AWigg2zEGDumv6JejQ2jjFsrKFm2LX9jjIfEh-vhiCdZ1RpRN-ghdSM"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-background-dark/80 via-background-dark/20 to-transparent p-12">
          <blockquote className="mt-8">
            <p className="text-xl font-medium text-white">
              "Education is the passport to the future, for tomorrow belongs to those who prepare for it today."
            </p>
            <footer className="mt-4">
              <p className="text-primary-200 text-base font-semibold text-white opacity-90">
                – SmartSikchya Philosophy
              </p>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="flex h-full flex-1 flex-col justify-center overflow-y-auto bg-background-light px-4 py-12 dark:bg-background-dark sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Branding Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  clipRule="evenodd"
                  d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"
                  fill="currentColor"
                  fillRule="evenodd"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">SmartSikchya</h2>
          </div>

          {/* Page Heading */}
          <div className="mb-10">
            <h2 className="text-3xl font-black leading-tight tracking-[-0.033em] text-text-main dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-base text-text-muted dark:text-gray-400">
              Please enter your details to access your learning dashboard.
            </p>
          </div>

          {/* Form */}
          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <Label
                  htmlFor="email"
                  className="block pb-2 text-base font-medium leading-normal text-text-main dark:text-gray-200"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full border-border-light bg-white px-4 py-3.5 text-base text-text-main shadow-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-dark dark:text-white"
                />
              </div>

              {/* Password Field */}
              <div>
                <Label
                  htmlFor="password"
                  className="block pb-2 text-base font-medium leading-normal text-text-main dark:text-gray-200"
                >
                  Password
                </Label>
                <div className="relative flex">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 flex-1 rounded-r-none border-r-0 border-border-light bg-white px-4 py-3.5 text-base text-text-main shadow-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-dark dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="inline-flex items-center rounded-r-lg border border-l-0 border-border-light bg-white px-4 text-text-muted hover:text-primary focus:outline-none dark:border-border-dark dark:bg-surface-dark dark:text-gray-400"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-primary transition-colors hover:text-primary-dark dark:hover:text-primary/80"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <div>
                <Button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center bg-primary px-4 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                >
                  Login
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background-light px-2 text-gray-500 dark:bg-background-dark dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <div className="mt-6">
                <a
                  href="#"
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-text-main shadow-sm transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-surface-dark/80"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  <span className="text-base font-medium">Google</span>
                </a>
              </div>
            </div>

            {/* Sign Up Footer */}
            <p className="mt-8 text-center text-sm text-text-muted dark:text-gray-400">
              Don't have an account?
              <Link
                href="/signup"
                className="ml-1 font-bold text-primary transition-colors hover:text-primary-dark dark:hover:text-primary/80"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
