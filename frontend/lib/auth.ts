import type { Role, TokenResponse } from "@/types";

export const saveToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("auth-storage");
  }
};

export const roleHome = (role: Role | string) => (role === "admin" ? "/admin" : "/dashboard");

export const saveAuth = (data: TokenResponse) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", data.access_token);
  }
};
