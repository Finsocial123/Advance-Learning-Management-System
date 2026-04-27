"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Shield,
  Trash2,
  UserCheck,
  UserX,
  GraduationCap,
  Search,
} from "lucide-react";
import { userService } from "@/services/user.service";
import { adminService } from "@/services/admin.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/utils";
import { User } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

export default function AdminUsersPage() {
  useRoleGuard(["admin"]);
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.includes(q)
      )
    );
  }, [search, users]);

  const handleRoleChange = async (
    userId: number,
    newRole: "student" | "teacher"
  ) => {
    setActionLoading(userId);
    try {
      const updated = await adminService.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updated : u))
      );
      toast.success(
        `User promoted to ${newRole}`
      );
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
        prev.map((u) => (u.id === userId ? updated : u))
      );
      toast.success(
        updated.is_active ? "User activated" : "User deactivated"
      );
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
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.id));
      toast.success("User deleted");
      setDeleteModal(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            User Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {users.length} total users
          </p>
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors w-56"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">
                  User
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center shrink-0">
                        {u.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt={u.name}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-zinc-300">
                            {getInitials(u.name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-100">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-zinc-600">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={u.role} variant="role" />
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      label={u.is_active ? "active" : "inactive"}
                      variant={u.is_active ? "success" : "danger"}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {u.id !== currentUser?.id && (
                        <>
                          {/* promote/demote */}
                          {u.role === "student" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={actionLoading === u.id}
                              onClick={() =>
                                handleRoleChange(u.id, "teacher")
                              }
                            >
                              <GraduationCap size={13} />
                              Make Teacher
                            </Button>
                          )}
                          {u.role === "teacher" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={actionLoading === u.id}
                              onClick={() =>
                                handleRoleChange(u.id, "student")
                              }
                            >
                              Make Student
                            </Button>
                          )}

                          {/* toggle active */}
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={actionLoading === u.id}
                            onClick={() => handleToggleActive(u.id)}
                          >
                            {u.is_active ? (
                              <UserX size={14} className="text-orange-400" />
                            ) : (
                              <UserCheck
                                size={14}
                                className="text-green-400"
                              />
                            )}
                          </Button>

                          {/* delete */}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteModal(u)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No users found.
            </div>
          )}
        </div>
      </div>

      {/* delete confirm */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete User"
        size="sm"
      >
        <p className="text-sm text-zinc-400 mb-6">
          Are you sure you want to permanently delete{" "}
          <span className="text-zinc-100 font-medium">
            {deleteModal?.name}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setDeleteModal(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleDelete}
          >
            Delete User
          </Button>
        </div>
      </Modal>
    </div>
  );
}