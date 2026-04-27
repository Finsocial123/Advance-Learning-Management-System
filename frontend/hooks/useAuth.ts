import { useAuthStore } from "@/store/authStore";
import { Role } from "@/types";

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, setUser, logout, hasRole } =
    useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    setAuth,
    setUser,
    logout,
    hasRole,
    isAdmin: user?.role === "admin",
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
  };
}