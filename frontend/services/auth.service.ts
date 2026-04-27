import api from "@/lib/axios";
import { TokenResponse } from "@/types";

export const authService = {
  async register(name: string, email: string, password: string) {
    const res = await api.post<TokenResponse>("/auth/register", {
      name,
      email,
      password,
    });
    return res.data;
  },

  async login(email: string, password: string) {
    const res = await api.post<TokenResponse>("/auth/login", {
      email,
      password,
    });
    return res.data;
  },
};