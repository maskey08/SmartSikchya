import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { env } from "@/config/env";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Show Google error if redirected back with error param
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "google_failed")
      setError("Google sign-in failed. Please try again.");
    if (err === "no_email")
      setError("Google account has no email. Use email/password.");
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      // navigate happens via useEffect above once isAuthenticated changes
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Invalid email or password.",
      );
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${env.apiBaseUrl}/auth/google`;
  }

  return (
    <div className="flex min-h-screen bg-background text-text-main">
      {/* Left: brand panel */}
      <div className="relative hidden flex-1 lg:flex lg:flex-col lg:justify-between overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEjx-g52YQ42ZnLcTUi8zdl1AyWdRC-vrXnjJ4103je_IfasB_TKy2c57pLQpCI48YpeWNrc3JphY5eGQNrDQvKU4MbWARedPdgyClxQ_tXvqjqCEn4HNjVehzNf0qLzGy5fs9VJi0-tActHTxD605mgKNpPNO9NAMf0sRbzr_pje-FGgDpK3DI5WZpP-BrZXopfcsUUS5pHuIVgH0L4M0AWigg2zEGDumv6JejQ2jjFsrKFm2LX9jjIfEh-vhiCdZ1RpRN-ghdSM"
          alt="Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative z-10 p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <span className="material-symbols-outlined text-white">
                school
              </span>
            </div>
            <span className="text-lg font-bold text-white">SmartSikshya</span>
          </Link>
        </div>
        <div className="relative z-10 p-10">
          <blockquote>
            <p className="text-xl font-medium leading-relaxed text-white">
              "Education is the passport to the future."
            </p>
            <footer className="mt-3 text-sm text-white/60">
              — SmartSikshya
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-background px-6 py-12 sm:px-12 lg:max-w-[520px] lg:px-16 xl:px-24">
        <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-primary">
              school
            </span>
          </div>
          <span className="text-lg font-bold text-text-main">SmartSikshya</span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-black tracking-tight text-text-main">
            Welcome back
          </h1>
          <p className="mt-2 text-text-muted">
            Sign in to continue your learning journey.
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface text-sm font-semibold text-text-main transition-all hover:border-primary/30 hover:bg-primary/5"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs font-medium text-text-muted">
                or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-main">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative flex">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 flex-1 rounded-l-xl border border-r-0 border-border bg-surface px-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="flex items-center justify-center rounded-r-xl border border-border bg-surface px-4 text-text-muted hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full font-bold"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-primary hover:text-primary-hover"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
