import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-primary">
              school
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight text-text-main">
            SmartSikshya
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            Features
          </a>
          <a
            href="#how"
            className="text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            How it works
          </a>
        </nav>

        {/* Right slot (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login">
            <Button variant="ghost" className="text-sm font-semibold">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="text-sm font-semibold">Get started free</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-border/40 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-border/40 hover:text-primary"
            >
              Features
            </a>
            <a
              href="#how"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-border/40 hover:text-primary"
            >
              How it works
            </a>
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full text-sm">Get started free</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
