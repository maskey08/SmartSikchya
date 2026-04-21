import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { env } from "@/config/env";
import PublicNavbar from "@/features/auth/component/PublicNavbar";

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await register(fullName, email, password);
      // navigate via useEffect
    } catch (err: any) {
      console.log(err.response); // ADD THIS
      setError(
        err?.response?.data?.detail ?? "Registration failed. Try again.",
      );
    }
  }

  const strengthLevel =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;

  const strengthConfig = [
    null,
    { label: "Weak", color: "bg-danger", width: "w-1/3" },
    { label: "Fair", color: "bg-warning", width: "w-2/3" },
    { label: "Strong", color: "bg-success", width: "w-full" },
  ];
  const strength = strengthConfig[strengthLevel];

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-main">
      <PublicNavbar />

      <main className="flex flex-1 items-center justify-center p-4 py-10">
        <div className="flex w-full max-w-[1100px] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl lg:min-h-[700px] lg:flex-row">
          {/* Form side */}
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-10 sm:px-12 lg:px-16">
            <div className="mx-auto w-full max-w-[420px]">
              <h1 className="text-3xl font-black tracking-tight text-text-main">
                Create your account
              </h1>
              <p className="mt-2 text-text-muted">
                Join thousands of students learning effectively.
              </p>

              {/* Google */}
              <button
                onClick={() => {
                  window.location.href = `${env.apiBaseUrl}/auth/google`;
                }}
                className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold text-text-main transition-all hover:border-primary/30 hover:bg-primary/5"
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
                Sign up with Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface px-3 text-xs text-text-muted">
                    or sign up with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Full name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">
                    Full name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                      <span className="material-symbols-outlined text-[18px]">
                        person
                      </span>
                    </span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                      <span className="material-symbols-outlined text-[18px]">
                        mail
                      </span>
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                      <span className="material-symbols-outlined text-[18px]">
                        lock
                      </span>
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-12 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPw ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {strength && (
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          strengthLevel === 1
                            ? "text-danger"
                            : strengthLevel === 2
                              ? "text-warning"
                              : "text-success"
                        }`}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span className="text-sm text-text-muted">
                    I agree to the{" "}
                    <a
                      href="/legal/terms.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/legal/privacy.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                    <span className="material-symbols-outlined text-lg">
                      error
                    </span>
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="mt-1 w-full font-bold"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-lg">
                        progress_activity
                      </span>
                      Creating account...
                    </span>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-primary hover:text-primary-hover"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* Visual side */}
          <div className="relative hidden w-[42%] flex-col items-center justify-center overflow-hidden bg-primary p-12 lg:flex">
            <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 flex flex-col items-center gap-8 text-center">
              <div className="flex size-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <span className="material-symbols-outlined text-4xl text-white">
                  menu_book
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Start your academic journey.
                </h3>
                <p className="mt-3 text-white/70">
                  Adaptive practice questions, XP rewards, and progress
                  tracking.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-3">
                {[
                  { icon: "check_circle", label: "Expert content" },
                  { icon: "analytics", label: "Live analytics" },
                  { icon: "psychology", label: "Adaptive AI" },
                  { icon: "emoji_events", label: "Earn badges" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="rounded-xl border border-white/10 bg-white/10 p-3"
                  >
                    <span className="material-symbols-outlined mb-1 text-xl text-white/80">
                      {f.icon}
                    </span>
                    <p className="text-xs font-semibold text-white">
                      {f.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
