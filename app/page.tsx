import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-[#0e131b] dark:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-solid border-b-[#e7ecf3] bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-[#111821]/80">
        <div className="layout-container flex h-full grow flex-col">
          <div className="flex flex-1 justify-center px-4 py-3 md:px-10 lg:px-40">
            <div className="layout-content-container flex w-full max-w-[1200px] flex-row items-center justify-between">
              <div className="flex items-center gap-4 text-[#0e131b] dark:text-white">
                <div className="size-8 text-primary">
                  <span className="material-symbols-outlined !text-3xl">school</span>
                </div>
                <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-[#0e131b] dark:text-white">
                  SmartSikchya
                </h2>
              </div>
              <div className="hidden flex-1 items-center justify-end gap-8 md:flex">
                <div className="flex items-center gap-9">
                  <a
                    className="text-sm font-medium text-[#0e131b] transition-colors hover:text-primary dark:text-gray-300"
                    href="#"
                  >
                    Features
                  </a>
                  <a
                    className="text-sm font-medium text-[#0e131b] transition-colors hover:text-primary dark:text-gray-300"
                    href="#"
                  >
                    For Schools
                  </a>
                  <a
                    className="text-sm font-medium text-[#0e131b] transition-colors hover:text-primary dark:text-gray-300"
                    href="#"
                  >
                    About
                  </a>
                </div>
                <div className="flex gap-3">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="h-10 min-w-[84px] border-[#e7ecf3] bg-transparent text-sm font-bold tracking-[0.015em] text-[#0e131b] transition-all hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="h-10 min-w-[84px] bg-primary text-sm font-bold tracking-[0.015em] text-white shadow-sm transition-all hover:bg-blue-700">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
              {/* Mobile Menu Icon */}
              <div className="flex items-center md:hidden">
                <button className="text-[#0e131b] dark:text-white">
                  <span className="material-symbols-outlined">menu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex w-full flex-grow flex-col items-center">
        {/* Hero Section */}
        <section className="flex w-full justify-center bg-white px-4 py-12 dark:bg-background-dark md:px-10 md:py-24 lg:px-40">
          <div className="flex w-full max-w-[1200px] flex-col-reverse items-center gap-12 lg:flex-row lg:gap-20">
            <div className="flex flex-col items-start gap-6 text-left lg:w-1/2">
              <div className="flex flex-col gap-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                  <span className="material-symbols-outlined !text-sm">new_releases</span>
                  <span>New AI Tutor Available</span>
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#0e131b] dark:text-white sm:text-5xl lg:text-6xl">
                  Smart Learning for <span className="text-primary">Brighter Futures</span>
                </h1>
                <h2 className="max-w-lg text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-400">
                  Personalized learning paths for every student. Access thousands of curated lessons and quizzes
                  tailored to your curriculum to master any subject.
                </h2>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link href="/signup">
                  <Button className="flex h-12 items-center justify-center bg-primary px-8 text-base font-bold tracking-[0.015em] text-white shadow-md transition-all hover:bg-blue-700">
                    Start Learning Now
                    <span className="material-symbols-outlined ml-2 !text-lg">arrow_forward</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex h-12 items-center justify-center border-slate-200 bg-white px-8 text-base font-bold tracking-[0.015em] text-[#0e131b] transition-all hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  View Demo
                </Button>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <span className="material-symbols-outlined !text-sm text-green-500">check_circle</span> No credit card
                required for trial
              </p>
            </div>
            <div className="flex w-full justify-center lg:w-1/2">
              <div className="relative aspect-square w-full max-w-[500px] lg:max-w-none">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 opacity-50 blur-3xl"></div>
                <div
                  className="relative h-full w-full transform overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat shadow-2xl transition-transform duration-500 rotate-2 hover:rotate-0"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQA9UgZUaCVcFjiftKnTrX9MMBs7StcD3U9IXsmkAftQnlooVXOR5R88f42xYr2PMQMlDhXUE-obIz1bq2ht6DqjNBoWyo1czw5WsTJSDoefeTYLJTElZju3B2cpKxgkWq7UdPb3lf1YGu7JkyOOYON7okMRAfripcDrPfZOfPyw6aFCFB1rjfbaDeirKS0nUdwivyHUqQd3alRNOTydMtih2u4Tn6ZHXdb93rNw4GKXl6ZbjKFSJE4IDkD3T0uh-CN4JAjkie6GY")',
                  }}
                ></div>
                {/* Floating Card Badge */}
                <div
                  className="absolute -bottom-6 -left-6 flex animate-bounce items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  style={{ animationDuration: "3s" }}
                >
                  <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Daily Progress</p>
                    <p className="text-sm font-bold text-[#0e131b] dark:text-white">+24% Improvement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Strip */}
        <section className="w-full border-y border-slate-100 bg-slate-50 py-8 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mx-auto max-w-[1200px] px-4 text-center">
            <p className="mb-6 text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trusted by students from leading institutions
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60 transition-all duration-500 hover:grayscale-0 md:gap-16 grayscale">
              <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300">
                <span className="material-symbols-outlined">school</span> University A
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300">
                <span className="material-symbols-outlined">menu_book</span> College B
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300">
                <span className="material-symbols-outlined">science</span> Institute C
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300">
                <span className="material-symbols-outlined">history_edu</span> Academy D
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="flex w-full justify-center bg-white px-4 py-20 dark:bg-background-dark md:px-10 lg:px-40">
          <div className="flex w-full max-w-[1200px] flex-col gap-12">
            <div className="mx-auto flex max-w-[720px] flex-col gap-4 text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-[#0e131b] dark:text-white md:text-4xl">
                Why Choose SmartSikchya?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                We combine advanced technology with expert pedagogy to create an ecosystem where learning feels natural
                and rewarding.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group flex flex-col gap-4 rounded-2xl border border-[#d0d9e7] bg-slate-50 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-primary transition-transform group-hover:scale-110 dark:bg-blue-900/30">
                  <span className="material-symbols-outlined !text-3xl">quiz</span>
                </div>
                <h3 className="text-xl font-bold text-[#0e131b] dark:text-white">Interactive Quizzes</h3>
                <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                  Test your knowledge with real-time feedback. Our adaptive system identifies your weak spots instantly.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="group flex flex-col gap-4 rounded-2xl border border-[#d0d9e7] bg-slate-50 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-transform group-hover:scale-110 dark:bg-purple-900/30 dark:text-purple-400">
                  <span className="material-symbols-outlined !text-3xl">play_circle</span>
                </div>
                <h3 className="text-xl font-bold text-[#0e131b] dark:text-white">Video Lessons</h3>
                <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                  Learn from expert educators through high-definition video modules that break down complex topics.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="group flex flex-col gap-4 rounded-2xl border border-[#d0d9e7] bg-slate-50 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 transition-transform group-hover:scale-110 dark:bg-green-900/30 dark:text-green-400">
                  <span className="material-symbols-outlined !text-3xl">analytics</span>
                </div>
                <h3 className="text-xl font-bold text-[#0e131b] dark:text-white">Performance Analytics</h3>
                <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                  Track your progress over time with detailed charts. See exactly how much you've improved.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="flex w-full justify-center border-y border-slate-200 bg-background-light px-4 py-20 dark:border-gray-800 dark:bg-[#1a222d]">
          <div className="flex w-full max-w-[1000px] flex-col items-center gap-10 text-center">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold uppercase tracking-wide text-primary">Testimonials</span>
              <h2 className="text-3xl font-bold text-[#0e131b] dark:text-white">Loved by Learners Everywhere</h2>
            </div>
            <div className="relative max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-[#111821] md:p-12">
              <span className="material-symbols-outlined absolute left-8 top-8 -z-0 !text-6xl text-slate-200 dark:text-slate-700">
                format_quote
              </span>
              <div className="relative z-10 flex flex-col items-center gap-6">
                <p className="text-lg font-medium italic leading-relaxed text-slate-700 dark:text-slate-300 md:text-xl">
                  "SmartSikchya transformed the way I study. The personalized path made all the difference in my exam
                  preparation. I went from feeling overwhelmed to completely confident in just three weeks."
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="h-16 w-16 rounded-full border-2 border-white bg-cover bg-center shadow-md dark:border-gray-600"
                    style={{
                      backgroundImage:
                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDs2qbG_TKQQHO4_F-TbmkMV6foUYSJqRSboo-VgwgXHT7lqxyjcPr3n72SjAam_Z6surBOtUGXND3EprsptKO9u7Xlba4IE_ZFeUQZGfYmFbzFjhmg8VZEnyqEjQJ85rw0woPxxn31-bu73EvxT9sBCDFe_BTObyManCUEgODjbjU5lOzf2Gm1d2Ux_1Bm17JhMXAgqVkSD-bfSz-HUAEYDoDNkpbIe74z7ZnAZbJY3EjvYQcNqI4Ev0VXRujj1q01QfOKOPxKIBQ")',
                    }}
                  ></div>
                  <div>
                    <h4 className="text-base font-bold text-[#0e131b] dark:text-white">Alex Johnson</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Computer Science Student</p>
                  </div>
                  <div className="flex gap-1 text-yellow-400">
                    <span className="material-symbols-outlined !text-xl fill-current">star</span>
                    <span className="material-symbols-outlined !text-xl fill-current">star</span>
                    <span className="material-symbols-outlined !text-xl fill-current">star</span>
                    <span className="material-symbols-outlined !text-xl fill-current">star</span>
                    <span className="material-symbols-outlined !text-xl fill-current">star</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA / Bottom Section */}
        <section className="flex w-full justify-center bg-white px-4 py-24 dark:bg-background-dark">
          <div className="relative w-full max-w-[1200px] overflow-hidden rounded-3xl bg-primary shadow-2xl">
            {/* Decorative Background Circles */}
            <div className="absolute -mr-20 -mt-20 right-0 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -mb-20 -ml-20 bottom-0 left-0 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 p-8 md:flex-row md:p-16">
              <div className="flex flex-col gap-4 text-left md:max-w-xl">
                <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">
                  Ready to boost your grades?
                </h2>
                <p className="text-lg text-blue-100">
                  Join over 10,000 students mastering their curriculum today with SmartSikchya.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button className="flex h-14 items-center justify-center bg-white px-8 text-base font-bold tracking-[0.015em] text-primary shadow-lg transition-colors hover:bg-slate-100">
                    Get Started for Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-background-light px-4 py-12 dark:border-gray-800 dark:bg-background-dark md:px-10 lg:px-40">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-4 pr-8 lg:col-span-2">
            <div className="flex items-center gap-2 text-[#0e131b] dark:text-white">
              <span className="material-symbols-outlined text-primary">school</span>
              <h2 className="text-lg font-bold">SmartSikchya</h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Empowering the next generation of learners with AI-driven tools and expert content.
            </p>
            <div className="mt-2 flex gap-4">
              <a className="text-slate-400 transition-colors hover:text-primary" href="#">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a className="text-slate-400 transition-colors hover:text-primary" href="#">
                <span className="material-symbols-outlined">alternate_email</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#0e131b] dark:text-white">Product</h3>
            <div className="flex flex-col gap-2">
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Features
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Pricing
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                For Schools
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Case Studies
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#0e131b] dark:text-white">Company</h3>
            <div className="flex flex-col gap-2">
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                About Us
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Careers
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Blog
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Contact
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#0e131b] dark:text-white">Legal</h3>
            <div className="flex flex-col gap-2">
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Privacy Policy
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Terms of Service
              </a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary dark:text-slate-400" href="#">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1200px] flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-gray-800 md:flex-row">
          <p className="text-xs text-slate-400 dark:text-slate-600">© 2025 SmartSikchya Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-xs text-slate-400 dark:text-slate-600">Made with ❤️ for Education</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
