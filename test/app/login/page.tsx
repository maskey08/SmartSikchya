"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithGoogle } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await signIn(email, password)
    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error ?? "Login failed")
      setIsLoading(false)
    }
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
              "Education is the passport to the future, for tomorrow belongs to those who prepare
              for it today."
            </p>
            <footer className="mt-4">
              <p className="text-base font-semibold text-white opacity-90">
                – SmartSikchya Philosophy
              </p>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="flex h-full flex-1 flex-col justify-center overflow-y-auto bg-background-light px-4 py-12 dark:bg-background-dark sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo → landing page */}
          <Link href="/" className="mb-8 flex items-center gap-3 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">
              SmartSikchya
            </h2>
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl font-black leading-tight tracking-[-0.033em] text-text-main dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-base text-text-muted dark:text-gray-400">
              Please enter your details to access your learning dashboard.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="abc@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full border-border-light bg-white px-4 py-3.5 text-base text-text-main shadow-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-dark dark:text-white"
                />
              </div>

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

              <div className="flex items-center justify-end">
                <a
                  href="#"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary-dark dark:hover:text-primary/80"
                >
                  Forgot your password?
                </a>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center bg-primary px-4 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

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

              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    await signInWithGoogle(credentialResponse as { credential?: string })
                    router.push("/dashboard")
                  }}
                  onError={() => {
                    setError("Google sign-in failed. Please try again.")
                  }}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-text-muted dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-primary transition-colors hover:text-primary-dark dark:hover:text-primary/80"
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
