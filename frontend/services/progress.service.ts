import api from "@/lib/axios";
import { CourseProgress } from "@/types";

export const progressService = {
  async markComplete(lessonId: number) {
    const res = await api.post(`/progress/${lessonId}/complete`);
    return res.data;
  },

  async markIncomplete(lessonId: number) {
    const res = await api.delete(`/progress/${lessonId}/complete`);
    return res.data;
  },

  async getCourseProgress(courseId: number) {
    const res = await api.get<CourseProgress>(
      `/progress/course/${courseId}`
    );
    return res.data;
  },
};