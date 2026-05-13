"use client";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function AdminPage() {
  const { checked } = useRoleGuard(["admin"]);

  if (!checked) return <FullPageSpinner />;

  return (
    <div className="page-shell max-w-7xl  w-full mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Platform overview and management.</p>
      </div>
      <AdminDashboard />
    </div>
  );
}
