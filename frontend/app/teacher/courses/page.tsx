"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2, BookOpen, Eye } from "lucide-react";
import { courseService } from "@/services/course.service";
import { useAuthStore } from "@/store/authStore";
import { Course } from "@/types";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import Image from "next/image";

export default function TeacherCoursesPage() {
  useRoleGuard(["teacher", "admin"]);
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const data = await courseService.getMyCreated();
      setCourses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await courseService.delete(deleteModal.id);
      toast.success("Course deleted");
      setCourses((prev) => prev.filter((c) => c.id !== deleteModal.id));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">My Courses</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your created courses
          </p>
        </div>
        <Button onClick={() => router.push("/teacher/courses/create")}>
          <Plus size={16} />
          New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start teaching students."
          action={
            <Button
              onClick={() => router.push("/teacher/courses/create")}
            >
              <Plus size={16} />
              Create Course
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-5 hover:border-zinc-700 transition-colors"
            >
              {/* thumbnail */}
              <div className="w-20 h-14 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={20} className="text-zinc-600" />
                  </div>
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-100 truncate">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-zinc-500 line-clamp-1 mt-0.5">
                    {course.description}
                  </p>
                )}
                <p className="text-xs text-zinc-600 mt-1">
                  Created {formatDate(course.created_at)}
                </p>
              </div>

              {/* actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  <Eye size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    router.push(
                      `/teacher/courses/${course.id}/lessons/create`
                    )
                  }
                >
                  <Plus size={14} />
                  Lesson
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/teacher/courses/${course.id}/edit`)
                  }
                >
                  <Edit size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteModal(course)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* delete confirm modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Course"
        size="sm"
      >
        <p className="text-sm text-zinc-400 mb-6">
          Are you sure you want to delete{" "}
          <span className="text-zinc-100 font-medium">
            {deleteModal?.title}
          </span>
          ? This will also delete all lessons and enrollments. This action
          cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}