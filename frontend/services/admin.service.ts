import api from "@/lib/axios";
import {
  AdminUserDetails,
  PaginatedUsersResponse,
  Role,
  User,
} from "@/types";

export const adminService = {
  async getPaginatedUsers(params: {
    role: "teacher" | "student";
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await api.get<PaginatedUsersResponse>("/admin/users", {
      params,
    });
    return res.data;
  },

  async getUserDetails(userId: number) {
    const res = await api.get<AdminUserDetails>(
      `/admin/users/${userId}/details`,
    );
    return res.data;
  },

  async updateRole(userId: number, role: Role) {
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
      `/admin/users/${userId}/toggle-active`,
    );
    return res.data;
  },

  async getStats() {
    const res = await api.get("/admin/stats");
    return res.data;
  },
};
