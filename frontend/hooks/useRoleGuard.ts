"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/types";

export function useRoleGuard(allowedRoles: Role[]) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [checked, setChecked] = useState(false);
  const allowedKey = useMemo(() => allowedRoles.join("|"), [allowedRoles]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!allowedKey.split("|").includes(user.role)) {
      router.replace("/dashboard");
      return;
    }

    setChecked(true);
  }, [hasHydrated, isAuthenticated, user, router, allowedKey]);

  return { user, isAuthenticated, checked };
}
