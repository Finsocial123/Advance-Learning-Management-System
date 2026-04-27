import api from "@/lib/axios";
import { User } from "@/types";

export const adminService = {
  async updateRole(userId: number, role: string) {
    const res = await api.put<User>(`/admin/users/${userId}/role`, {
      role,
    });
    return res.data;
  },

  async deleteUser(userId: number) {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  async toggleActive(userId: number) {
    const res = await api.put<User>(
      `/admin/users/${userId}/toggle-active`
    );
    return res.data;
  },

  async getStats() {
    const res = await api.get("/admin/stats");
    return res.data;
  },
};