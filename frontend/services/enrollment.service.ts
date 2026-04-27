import api from "@/lib/axios";
import { Enrollment } from "@/types";

export const enrollmentService = {
  async enroll(courseId: number) {
    const res = await api.post(`/enrollments/${courseId}`);
    return res.data;
  },

  async unenroll(courseId: number) {
    const res = await api.delete(`/enrollments/${courseId}`);
    return res.data;
  },

  async getMyEnrollments() {
    const res = await api.get<Enrollment[]>("/enrollments/my");
    return res.data;
  },

  async checkEnrollment(courseId: number) {
    const res = await api.get<{ enrolled: boolean }>(
      `/enrollments/check/${courseId}`
    );
    return res.data;
  },
};