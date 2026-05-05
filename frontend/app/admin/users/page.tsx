"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Search,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useAuthStore } from "@/store/authStore";
import { cn, getErrorMessage, getInitials } from "@/lib/utils";
import { AdminUserListItem } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Spinner, { FullPageSpinner } from "@/components/ui/Spinner";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type ManageRole = "teacher" | "student";

export default function AdminUsersPage() {
  const { checked } = useRoleGuard(["admin"]);
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [activeRole, setActiveRole] = useState<ManageRole>("teacher");
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<AdminUserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getPaginatedUsers({
        role: activeRole,
        search: debouncedSearch || undefined,
        page,
        limit,
      });
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeRole, debouncedSearch, page, limit]);

  useEffect(() => {
    if (checked) loadUsers();
  }, [checked, loadUsers]);

  const handleTabChange = (role: ManageRole) => {
    setActiveRole(role);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleRoleChange = async (
    userId: number,
    newRole: "student" | "teacher",
  ) => {
    setActionLoading(userId);
    try {
      await adminService.updateRole(userId, newRole);
      toast.success(`User changed to ${newRole}`);
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: number) => {
    setActionLoading(userId);
    try {
      const updated = await adminService.toggleActive(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: updated.is_active } : u,
        ),
      );
      toast.success(updated.is_active ? "User activated" : "User deactivated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await adminService.deleteUser(deleteModal.id);
      toast.success("User deactivated");
      setDeleteModal(null);
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (!checked) return <FullPageSpinner />;

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">User Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage teachers and students separately with optimized pagination.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder={`Search ${activeRole}s...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => handleTabChange("teacher")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              activeRole === "teacher"
                ? "bg-indigo-500/20 text-white shadow-sm"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <GraduationCap size={16} />
            Teachers
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("student")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              activeRole === "student"
                ? "bg-indigo-500/20 text-white shadow-sm"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <Users size={16} />
            Students
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Rows per page</span>
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-zinc-200 outline-none focus:border-violet-500"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold capitalize text-zinc-100">
                {activeRole}s
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Showing {showingFrom}-{showingTo} of {total} {activeRole}s
              </p>
            </div>
            {loading && <Spinner size="sm" />}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {activeRole === "teacher" ? "Courses" : "Progress"}
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!loading &&
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-700">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.name}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-zinc-300">
                              {getInitials(user.name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {user.name}
                            {user.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-zinc-600">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge label={user.role} variant="role" />
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={user.is_active ? "active" : "inactive"}
                        variant={user.is_active ? "success" : "danger"}
                      />
                    </td>
                    <td className="px-5 py-4">
                      {activeRole === "teacher" ? (
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <BookOpen size={15} className="text-sky-300" />
                          {user.total_courses ?? 0} created courses
                        </div>
                      ) : (
                        <div className="min-w-52">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-zinc-500">
                              {user.total_enrolled_courses ?? 0} enrolled
                            </span>
                            <span className="font-semibold text-indigo-200">
                              {Math.round(user.average_progress ?? 0)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-slate-700/50">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-sky-400 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  Math.max(user.average_progress ?? 0, 0),
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td
                      className="px-5 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {user.id !== currentUser?.id && (
                          <>
                            {user.role === "student" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={actionLoading === user.id}
                                onClick={() =>
                                  handleRoleChange(user.id, "teacher")
                                }
                              >
                                <GraduationCap size={13} />
                                Make Teacher
                              </Button>
                            )}
                            {user.role === "teacher" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={actionLoading === user.id}
                                onClick={() =>
                                  handleRoleChange(user.id, "student")
                                }
                              >
                                Make Student
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              loading={actionLoading === user.id}
                              title={
                                user.is_active
                                  ? "Deactivate user"
                                  : "Activate user"
                              }
                              onClick={() => handleToggleActive(user.id)}
                            >
                              {user.is_active ? (
                                <UserX size={14} className="text-orange-400" />
                              ) : (
                                <UserCheck size={14} className="text-green-400" />
                              )}
                            </Button>

                            {/* <Button
                              size="sm"
                              variant="danger"
                              title="Deactivate user"
                              onClick={() => setDeleteModal(user)}
                            >
                              <Trash2 size={13} />
                            </Button> */}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && users.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-zinc-300">
                No {activeRole}s found.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Try changing your search or switch to another tab.
              </p>
            </div>
          )}

          {loading && users.length === 0 && (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <p className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={15} />
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Deactivate User"
        size="sm"
      >
        <p className="mb-6 text-sm text-zinc-400">
          Are you sure you want to deactivate{" "}
          <span className="font-medium text-zinc-100">{deleteModal?.name}</span>?
          They will not be able to use the platform until reactivated.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
