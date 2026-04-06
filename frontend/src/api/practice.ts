import { api } from "@/lib/axios";

export interface QuestionOut {
  question_id: number;
  question_text: string;
  question_type: "mcq" | "fib" | "short";
  options: Record<string, string> | null;
  difficulty: "easy" | "medium" | "hard";
}

export interface StartSessionOut {
  session_id: number;
  questions: QuestionOut[];
  target_difficulty: string;
}

export interface AnswerOut {
  is_correct: boolean;
  correct_answer: string;
  explanation: string | null;
  xp_awarded: number;
}

export interface CompleteSessionOut {
  session_id: number;
  total_q: number;
  correct_count: number;
  accuracy_pct: number;
  xp_earned: number;
  total_xp: number;
  level: number;
  levelled_up: boolean;
}

export interface ReviewItem {
  question_id: number;
  question_text: string;
  question_type: "mcq" | "fib" | "short";
  options: Record<string, string> | null;
  given_answer: string | null;
  correct_answer: string | null;
  is_correct: boolean;
  difficulty: string;
  xp_awarded: number;
}

export interface ReviewOut {
  session_id: number;
  items: ReviewItem[];
  total_xp: number;
  level: number;
  recommendation: string | null;
}

export const sessionsApi = {
  start: async (chapter_id: number, user_id = 1): Promise<StartSessionOut> => {
    const { data } = await api.post("/sessions/start", { chapter_id, user_id });
    return data;
  },

  answer: async (
    session_id: number,
    question_id: number,
    given_answer: string,
    time_taken_seconds = 0,
  ): Promise<AnswerOut> => {
    const { data } = await api.post(`/sessions/${session_id}/answer`, {
      question_id,
      given_answer,
      time_taken_seconds,
    });
    return data;
  },

  complete: async (
    session_id: number,
    user_id = 1,
  ): Promise<CompleteSessionOut> => {
    const { data } = await api.post(`/sessions/${session_id}/complete`, null, {
      params: { user_id },
    });
    return data;
  },

  review: async (session_id: number, user_id = 1): Promise<ReviewOut> => {
    const { data } = await api.get(`/sessions/${session_id}/review`, {
      params: { user_id },
    });
    return data;
  },
};

export const subjectsApi = {
  list: async () => {
    const { data } = await api.get("/subjects");
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`/subjects/${id}`);
    return data;
  },
  chapters: async (id: number, user_id = 1) => {
    const { data } = await api.get(`/subjects/${id}/chapters`, {
      params: { user_id },
    });
    return data;
  },
};
