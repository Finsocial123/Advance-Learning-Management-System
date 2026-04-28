import api from "@/lib/axios";
import { TokenResponse } from "@/types";

type SignupRole = "student" | "teacher";

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

  async google(credential: string) {
    const res = await api.post<TokenResponse>("/auth/google", { credential });
    return res.data;
  },

  async sendSignupOtp(email: string) {
    const res = await api.post<{ message: string; dev_otp?: string | null }>("/auth/send-signup-otp", { email });
    return res.data;
  },

  async verifySignupOtp(data: { name: string; email: string; password: string; role: SignupRole; otp: string }) {
    const res = await api.post<TokenResponse>("/auth/verify-signup-otp", data);
    return res.data;
  },

  async sendLoginOtp(email: string) {
    const res = await api.post<{ message: string; dev_otp?: string | null }>("/auth/send-login-otp", { email });
    return res.data;
  },

  async verifyLoginOtp(email: string, otp: string) {
    const res = await api.post<TokenResponse>("/auth/verify-login-otp", { email, otp });
    return res.data;
  },

  async sendForgotPasswordOtp(email: string) {
    const res = await api.post<{ message: string; dev_otp?: string | null }>("/auth/forgot-password/send-otp", { email });
    return res.data;
  },

  async resetPassword(data: { email: string; otp: string; new_password: string }) {
    const res = await api.post<{ message: string }>("/auth/forgot-password/reset", data);
    return res.data;
  },
};
