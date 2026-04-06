import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { Layout } from "@/components/Layout";

// Public pages
const LandingPage = lazy(() => import("@/features/auth/pages/LandingPage"));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const SignupPage = lazy(() => import("@/features/auth/pages/SignupPage"));

// Protected pages
const DashboardPage = lazy(
  () => import("@/features/dashboard/pages/DashboardPage"),
);
const SubjectsPage = lazy(
  () => import("@/features/subjects/pages/SubjectsPage"),
);
const SubjectDetailPage = lazy(
  () => import("@/features/subjects/pages/SubjectDetailPage"),
);
const QuizPage = lazy(() => import("@/features/quiz/pages/QuizPage"));
const PracticePage = lazy(() => import("@/features/quiz/pages/PracticePage"));
const ResultsPage = lazy(() => import("@/features/quiz/pages/ResultsPage"));
const ProgressPage = lazy(
  () => import("@/features/progress/pages/ProgressPage"),
);
const RecommendationsPage = lazy(
  () => import("@/features/recommendations/pages/RecommendationsPage"),
);
const SettingsPage = lazy(
  () => import("@/features/settings/pages/SettingsPage"),
);
const ExamPage = lazy(() => import("@/features/exam/pages/ExamPage"));

const Loader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <span className="material-symbols-outlined animate-spin text-4xl text-primary">
      progress_activity
    </span>
  </div>
);

const S = (C: React.ComponentType) => (
  <Suspense fallback={<Loader />}>
    <C />
  </Suspense>
);

export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────
  { path: "/", element: S(LandingPage) },
  { path: "/login", element: S(LoginPage) },
  { path: "/signup", element: S(SignupPage) },

  // ── Protected + Layout shell ──────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout /> /* Sidebar + Header wrapper */,

        children: [
          { path: "/dashboard", element: S(DashboardPage) },
          { path: "/subjects", element: S(SubjectsPage) },
          { path: "/subjects/:subjectId", element: S(SubjectDetailPage) },
          { path: "/quiz/:chapterId", element: S(QuizPage) },
          { path: "/practice", element: S(PracticePage) },
          { path: "/quiz/:chapterId/results", element: S(ResultsPage) },
          { path: "/progress", element: S(ProgressPage) },
          { path: "/recommendations", element: S(RecommendationsPage) },
          { path: "/settings", element: S(SettingsPage) },
        ],
      },
    ],
  },

  // ── Exam has its own fullscreen layout (no sidebar) ───
  {
    element: <ProtectedRoute />,
    children: [{ path: "/exam/:examId", element: S(ExamPage) }],
  },
]);
