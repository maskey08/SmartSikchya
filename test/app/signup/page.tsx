"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/context/AuthContext"

export default function SignupPage() {
  const router = useRouter()
  const { signInWithGoogle } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Signup:", formData)
    router.push("/dashboard")
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display antialiased transition-colors duration-200 dark:bg-background-dark">
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border-light bg-surface-light px-6 py-4 dark:border-border-dark dark:bg-surface-dark lg:px-12">
        {/* Logo → landing page */}
        <Link href="/" className="flex items-center gap-3 text-text-main dark:text-white">
          <div className="flex size-8 items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">SmartSikchya</h2>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-text-main dark:text-gray-300 sm:inline">
            Already have an account?
          </span>
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
                <h1 className="mb-2 text-3xl font-bold text-text-main dark:text-white">
                  Create your account
                </h1>
                <p className="text-text-muted dark:text-gray-400">
                  Join thousands of students learning effectively.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="fullname"
                    className="block text-sm font-medium text-text-main dark:text-gray-200"
                  >
                    Full Name
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </span>
                    <Input
                      id="fullname"
                      name="fullname"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullname}
                      onChange={(e) => updateField("fullname", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-4 text-text-main shadow-sm placeholder:text-text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="block text-sm font-medium text-text-main dark:text-gray-200"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </span>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-4 text-text-main shadow-sm placeholder:text-text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="block text-sm font-medium text-text-main dark:text-gray-200"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </span>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-10 text-text-main shadow-sm placeholder:text-text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-text-muted transition-colors hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
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
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </span>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="w-full border-border-light bg-background-light py-3 pl-10 pr-10 text-text-main shadow-sm placeholder:text-text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-text-muted transition-colors hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Terms */}
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full border border-transparent bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-light dark:border-border-dark"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-surface-light px-2 text-text-muted dark:bg-surface-dark">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    await signInWithGoogle(credentialResponse as { credential?: string })
                    router.push("/dashboard")
                  }}
                  onError={() => {
                    console.error("Google signup failed")
                  }}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Visual Section */}
          <div className="group/visual relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-primary p-12 text-center text-white lg:flex">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-20">
              <div className="absolute left-[-20%] top-[-20%] h-[140%] w-[140%] rotate-12 transform rounded-full bg-gradient-to-br from-white via-transparent to-transparent opacity-30 blur-3xl"></div>
              <div className="absolute bottom-[-20%] right-[-20%] h-[100%] w-[100%] rounded-full bg-gradient-to-tl from-teal-900 via-transparent to-transparent opacity-40 blur-3xl"></div>
            </div>
            <div className="relative z-10 flex max-w-[320px] flex-col items-center gap-8">
              <div className="flex size-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-md">
                <span className="material-symbols-outlined text-4xl text-white">menu_book</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold leading-tight">
                  Start your academic journey today.
                </h3>
                <p className="text-lg font-light text-white/80">
                  Access premium learning materials, track your progress, and join a community of
                  lifelong learners.
                </p>
              </div>
              <div className="mt-8 grid w-full grid-cols-2 gap-4 text-left">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="material-symbols-outlined mb-2 text-2xl text-teal-200">
                    check_circle
                  </span>
                  <p className="text-sm font-semibold">Expert Content</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="material-symbols-outlined mb-2 text-2xl text-teal-200">
                    groups
                  </span>
                  <p className="text-sm font-semibold">Study Groups</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-text-muted dark:text-gray-500">
        <p>© 2025 SmartSikchya. All rights reserved.</p>
      </footer>
    </div>
  )
}
