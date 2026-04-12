import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Layout } from "@/components/Layout";
import { AdminLayout } from "@/features/admin/components/AdminLayout";

// ── Public ──────────────────────────────────────────────────────
const LandingPage = lazy(() => import("@/features/auth/pages/LandingPage"));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const SignupPage = lazy(() => import("@/features/auth/pages/SignupPage"));

// ── Protected student ───────────────────────────────────────────
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
const ProgressPage = lazy(
  () => import("@/features/progress/pages/ProgressPage"),
);
const RecommendationsPage = lazy(
  () => import("@/features/recommendations/pages/RecommendationsPage"),
);
const ExamPage = lazy(() => import("@/features/exam/pages/ExamPage"));
const SettingsPage = lazy(
  () => import("@/features/settings/pages/SettingsPage"),
);

// ── Admin ────────────────────────────────────────────────────────
const AdminOverview = lazy(
  () => import("@/features/admin/pages/AdminDashboard"),
);
const AdminUsersPage = lazy(
  () => import("@/features/admin/pages/AdminUsersPage"),
);
const AdminQuestionsPage = lazy(
  () => import("@/features/admin/pages/AdminQuestionsPage"),
);
const AdminSubjectsPage = lazy(
  () => import("@/features/admin/pages/AdminSubjectsPage"),
);
const AdminOCRPage = lazy(() => import("@/features/admin/pages/AdminOCRPage"));

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
  // Public
  { path: "/", element: S(LandingPage) },
  { path: "/login", element: S(LoginPage) },
  { path: "/signup", element: S(SignupPage) },

  // ── Admin — own layout ──────────────────────────────────────
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/admin", element: S(AdminOverview) },
          { path: "/admin/users", element: S(AdminUsersPage) },
          { path: "/admin/questions", element: S(AdminQuestionsPage) },
          { path: "/admin/subjects", element: S(AdminSubjectsPage) },
          { path: "/admin/ocr", element: S(AdminOCRPage) },
        ],
      },
    ],
  },

  // ── Protected student ───────────────────────────────────────
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
          { path: "/exam", element: S(ExamPage) },
          { path: "/progress", element: S(ProgressPage) },
          { path: "/recommendations", element: S(RecommendationsPage) },
          { path: "/settings", element: S(SettingsPage) },
        ],
      },
    ],
  },
]);
