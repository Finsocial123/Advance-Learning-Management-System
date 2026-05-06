import api from "@/lib/axios";
import { CourseProgress, VideoWatchProgress } from "@/types";

export const progressService = {
  async markComplete(lessonId: number) {
    const res = await api.post(`/progress/${lessonId}/complete`);
    return res.data;
  },

  async markIncomplete(lessonId: number) {
    const res = await api.delete(`/progress/${lessonId}/complete`);
    return res.data;
  },

  async trackVideoWatch(
    lessonId: number,
    data: {
      watched_seconds_delta: number;
      video_duration_seconds?: number;
      current_position_seconds?: number;
    },
  ) {
    const res = await api.post<VideoWatchProgress>(
      `/progress/${lessonId}/watch`,
      data,
    );
    return res.data;
  },

  async getVideoWatchProgress(lessonId: number) {
    const res = await api.get<VideoWatchProgress>(`/progress/${lessonId}/watch`);
    return res.data;
  },

  async getCourseProgress(courseId: number) {
    const res = await api.get<CourseProgress>(`/progress/course/${courseId}`);
    return res.data;
  },
};
