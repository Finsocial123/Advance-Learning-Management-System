"use client";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default function AdminPage() {
  useRoleGuard(["admin"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          Admin Dashboard
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Platform overview and management
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}