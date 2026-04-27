"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/types";

export function useRoleGuard(allowedRoles: Role[]) {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // wait until zustand has finished rehydrating from localStorage
    if (!_hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
      return;
    }
    const check = () =>{
      setChecked(true);
    }
    check();
  }, [_hasHydrated, isAuthenticated, user, router, allowedRoles]);

  return { user, isAuthenticated, checked };
}