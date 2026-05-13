import { getToken } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://103.180.163.187:60007";

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
};

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { detail?: string; message?: string } } };
    return axiosError.response?.data?.detail || axiosError.response?.data?.message || "Something went wrong";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
