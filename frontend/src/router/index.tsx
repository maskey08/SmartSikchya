import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Layout } from "@/components/Layout";

// ── Public ──────────────────────────────────────────────────────
const LandingPage = lazy(() => import("@/features/auth/pages/LandingPage"));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const SignupPage = lazy(() => import("@/features/auth/pages/SignupPage"));

// ── Protected (student) ─────────────────────────────────────────
const DashboardPage = lazy(
  () => import("@/features/dashboard/pages/DashboardPage"),
);
const SubjectsPage = lazy(
  () => import("@/features/subjects/pages/SubjectsPage"),
);
const SubjectDetailPage = lazy(
  () => import("@/features/subjects/pages/SubjectDetailPage"),
);
const PracticePage = lazy(() => import("@/features/quiz/pages/PracticePage"));
const QuizPage = lazy(() => import("@/features/quiz/pages/QuizPage"));
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

// ── Admin ────────────────────────────────────────────────────────
const AdminDashboard = lazy(
  () => import("@/features/admin/pages/AdminDashboard"),
);

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
  // ── Public ─────────────────────────────────────────────────────
  { path: "/", element: S(LandingPage) },
  { path: "/login", element: S(LoginPage) },
  { path: "/signup", element: S(SignupPage) },

  // ── Admin (must come before protected so AdminRoute check applies) ─
  {
    element: <AdminRoute />,
    children: [
      {
        element: <Layout />,
        children: [{ path: "/admin", element: S(AdminDashboard) }],
      },
    ],
  },

  // ── Protected student routes ────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/dashboard", element: S(DashboardPage) },
          { path: "/subjects", element: S(SubjectsPage) },
          { path: "/subjects/:subjectId", element: S(SubjectDetailPage) },
          { path: "/practice", element: S(PracticePage) },
          { path: "/quiz/:chapterId", element: S(QuizPage) },
          { path: "/quiz/:chapterId/results", element: S(ResultsPage) },
          { path: "/progress", element: S(ProgressPage) },
          { path: "/recommendations", element: S(RecommendationsPage) },
          { path: "/settings", element: S(SettingsPage) },
        ],
      },
    ],
  },

  // ── Exam — fullscreen, no sidebar ──────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [{ path: "/exam/:examId", element: S(ExamPage) }],
  },
]);
