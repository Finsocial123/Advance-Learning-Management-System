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
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

     const check = () =>{
      setChecked(true);
    }
    check();
  }, [_hasHydrated, isAuthenticated, user, router]);

  // show spinner while hydrating or checking auth
  if (!_hasHydrated || !checked) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-zinc-100">
            Welcome back, {user!.name.split(" ")[0]}
          </h1>
          <Badge label={user!.role} variant="role" />
        </div>
        <p className="text-sm text-zinc-500">
          {user!.role === "admin" && "Platform overview and management"}
          {user!.role === "teacher" && "Your courses and student progress"}
          {user!.role === "student" && "Your learning journey"}
        </p>
      </div>

      {user!.role === "admin" && <AdminDashboard />}
      {user!.role === "teacher" && <TeacherDashboard />}
      {user!.role === "student" && <StudentDashboard />}
    </div>
  );
}