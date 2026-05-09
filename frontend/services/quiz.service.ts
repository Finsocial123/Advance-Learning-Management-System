import api from "@/lib/axios";
import type {
  QuizDifficulty,
  QuizGeneratePayload,
  QuizResponse,
} from "@/types";

export const quizService = {
  async generateQuiz(payload: QuizGeneratePayload) {
    const res = await api.post<QuizResponse>(
      `/assignments/api/course/${payload.course_id}/lessons/${payload.lesson_id}/quiz`,
      {
        num_questions: payload.num_questions,
        difficulty: payload.difficulty,
      },
    );
    return res.data;
  },
};

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard"];
