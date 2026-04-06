// ─── User ──────────────────────────────────────────────────────
export interface User {
  user_id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "student" | "admin";
  total_xp: number;
  level: number;
  created_at: string;
}

// ─── Subject / Chapter ─────────────────────────────────────────
export interface Subject {
  subject_id: number;
  subject_name: string;
  slug: string | null;
  description: string | null;
  icon: string | null;
  color_class: string | null;
}

export interface Chapter {
  chapter_id: number;
  subject_id: number;
  chapter_name: string;
  order_num: number;
  description: string | null;
  is_locked: boolean;
  total_attempts: number;
  correct_answers: number;
  accuracy_pct: number;
}

// ─── Questions ─────────────────────────────────────────────────
export interface Question {
  question_id: number;
  subject_id: number | null;
  chapter_id: number | null;
  question_text: string;
  question_type: number; // 1=mcq, 2=short, 3=fib
  options: string[] | null;
  correct_answer: string | null;
  difficulty: "easy" | "medium" | "hard";
}

// ─── Session ───────────────────────────────────────────────────
export interface QuizSession {
  session_id: number;
  chapter_id: number | null;
  is_completed: boolean;
  correct_count: number;
  total_q: number;
  xp_earned: number;
  start_time: string | null;
}

// ─── Progress ──────────────────────────────────────────────────
export interface ChapterProgress {
  chapter_id: number;
  total_attempts: number;
  correct_answers: number;
  weakness_score: number | null;
}

// ─── API response wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
}
