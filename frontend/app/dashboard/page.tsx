"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import { FullPageSpinner } from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (!_hasHydrated || !checked) return <FullPageSpinner />;

  return (
    <div className="page-shell">
      <div className="section-header">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {user!.name.split(" ")[0]}
            </h1>
            <Badge label={user!.role} variant="role" />
          </div>
          <p className="text-sm text-slate-400">
            {user!.role === "admin" && "Platform overview and management"}
            {user!.role === "teacher" && "Your courses and student progress"}
            {user!.role === "student" && "Your learning journey"}
          </p>
        </div>
      </div>

      {user!.role === "admin" && <AdminDashboard />}
      {user!.role === "teacher" && <TeacherDashboard />}
      {user!.role === "student" && <StudentDashboard />}
    </div>
  );
}
