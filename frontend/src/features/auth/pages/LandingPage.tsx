import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import PublicNavbar from "@/features/auth/component/PublicNavbar";

const features = [
  {
    icon: "quiz",
    title: "Adaptive Quizzes",
    desc: "Questions adjust to your level in real time. The system finds your weak spots and targets them.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: "psychology",
    title: "Smart Recommendations",
    desc: "Rule-based engine suggests what to study next based on your accuracy and history.",
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    icon: "monitoring",
    title: "Progress Analytics",
    desc: "Visual dashboards showing mastery per chapter, accuracy trends, and time spent.",
    color: "bg-success/10 text-success",
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-text-main">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <PublicNavbar />
      <main className="flex w-full flex-grow flex-col">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="flex w-full justify-center bg-surface px-4 py-16 md:py-28">
          <div className="flex w-full max-w-[1200px] flex-col items-center gap-14 lg:flex-row lg:gap-16">
            {/* Text side */}
            <div className="flex flex-col gap-6 text-center lg:w-1/2 lg:text-left">
              <div className="inline-flex w-fit items-center gap-2 self-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary lg:self-start">
                <span className="material-symbols-outlined text-[14px]">
                  bolt
                </span>
                Adaptive Learning Platform
              </div>

              <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-text-main sm:text-5xl lg:text-[3.5rem]">
                Study smarter,
                <br />
                <span className="text-primary">not harder.</span>
              </h1>

              <p className="max-w-lg self-center text-lg leading-relaxed text-text-muted lg:self-start">
                SmartSikshya learns from your performance and serves exactly the
                right questions at the right difficulty — so every minute you
                study counts.
              </p>

              <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="gap-2 px-8 shadow-lg shadow-primary/20"
                  >
                    Start learning free
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="px-8">
                    Log in
                  </Button>
                </Link>
              </div>

              <p className="flex items-center justify-center gap-2 text-sm text-text-muted lg:justify-start">
                <span className="material-symbols-outlined text-sm text-success">
                  check_circle
                </span>
                No credit card required
              </p>
            </div>

            {/* Visual side */}
            <div className="relative flex w-full justify-center lg:w-1/2">
              <div className="relative w-full max-w-[480px]">
                {/* Glow */}
                <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
                <div
                  className="relative h-72 w-full rotate-1 overflow-hidden rounded-2xl bg-cover bg-center shadow-2xl transition-transform duration-500 hover:rotate-0 sm:h-96"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQA9UgZUaCVcFjiftKnTrX9MMBs7StcD3U9IXsmkAftQnlooVXOR5R88f42xYr2PMQMlDhXUE-obIz1bq2ht6DqjNBoWyo1czw5WsTJSDoefeTYLJTElZju3B2cpKxgkWq7UdPb3lf1YGu7JkyOOYON7okMRAfripcDrPfZOfPyw6aFCFB1rjfbaDeirKS0nUdwivyHUqQd3alRNOTydMtih2u4Tn6ZHXdb93rNw4GKXl6ZbjKFSJE4IDkD3T0uh-CN4JAjkie6GY")',
                  }}
                />
                {/* Floating stat */}
                <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-xl">
                  <div className="rounded-full bg-success/10 p-2 text-success">
                    <span className="material-symbols-outlined">
                      trending_up
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Avg. improvement</p>
                    <p className="text-sm font-bold text-text-main">
                      +31% in 3 weeks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────── */}
        <section
          id="features"
          className="flex w-full justify-center bg-background px-4 py-20"
        >
          <div className="flex w-full max-w-[1200px] flex-col gap-12">
            <div className="mx-auto flex max-w-[600px] flex-col gap-3 text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-primary">
                Features
              </span>
              <h2 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
                Built for how you actually learn
              </h2>
              <p className="text-text-muted">
                Every feature is designed around one goal — closing the gap
                between what you know and what you need to know.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
                >
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl ${f.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {f.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-text-main">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-muted">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────── */}
        <section
          id="how"
          className="flex w-full justify-center bg-surface px-4 py-20"
        >
          <div className="flex w-full max-w-[900px] flex-col gap-12">
            <div className="flex flex-col gap-3 text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-primary">
                How it works
              </span>
              <h2 className="text-3xl font-black tracking-tight text-text-main">
                Three steps to mastery
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: "login",
                  title: "Create account",
                  desc: "Sign up in seconds with Google or email.",
                },
                {
                  step: "02",
                  icon: "menu_book",
                  title: "Pick a subject",
                  desc: "Choose from your curriculum chapters.",
                },
                {
                  step: "03",
                  icon: "auto_awesome",
                  title: "Practice & grow",
                  desc: "The system adapts to your performance automatically.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="relative flex flex-col gap-4 rounded-2xl border border-border bg-background p-6"
                >
                  <span className="text-5xl font-black text-primary/10">
                    {s.step}
                  </span>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <h3 className="font-bold text-text-main">{s.title}</h3>
                  <p className="text-sm text-text-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────── */}
        <section className="flex w-full justify-center bg-background px-4 py-20">
          <div className="relative w-full max-w-[1200px] overflow-hidden rounded-3xl bg-primary">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 p-8 text-center md:flex-row md:p-14 md:text-left">
              <div>
                <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">
                  Ready to ace your exams?
                </h2>
                <p className="mt-2 text-white/75">
                  Join students already using SmartSikshya to study smarter.
                </p>
              </div>
              <Link to="/signup" className="shrink-0">
                <Button className="h-14 bg-white px-10 text-primary text-base font-bold hover:bg-white/90 shadow-lg">
                  Get started free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="w-full border-t border-border bg-surface px-4 py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} SmartSikshya. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-xs text-text-muted hover:text-primary transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs text-text-muted hover:text-primary transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
