import api from "@/lib/axios";
import {
  AdminDashboardData,
  TeacherDashboardData,
  StudentDashboardData,
} from "@/types";

export const dashboardService = {
  async getAdminDashboard() {
    const res = await api.get<AdminDashboardData>("/dashboard/admin");
    return res.data;
  },

  async getTeacherDashboard() {
    const res = await api.get<TeacherDashboardData>("/dashboard/teacher");
    return res.data;
  },

  async getStudentDashboard() {
    const res = await api.get<StudentDashboardData>("/dashboard/student");
    return res.data;
  },
};