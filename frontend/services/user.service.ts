import api from "@/lib/axios";
import { User } from "@/types";

export const userService = {
  async getMe() {
    const res = await api.get<User>("/users/me");
    return res.data;
  },

  async updateProfile(data: {
    name?: string;
    bio?: string;
    avatar?: File | null;
  }) {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.bio !== undefined) formData.append("bio", data.bio);
    if (data.avatar) formData.append("avatar", data.avatar);

    const res = await api.put<User>("/users/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getAllUsers() {
    const res = await api.get<User[]>("/users");
    return res.data;
  },

  async getUserById(id: number) {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },
};