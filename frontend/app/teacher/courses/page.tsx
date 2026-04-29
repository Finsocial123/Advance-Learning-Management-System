"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { BookOpen, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { courseService } from "@/services/course.service";
import { Course } from "@/types";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { formatDate, getErrorMessage } from "@/lib/utils";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Spinner, { FullPageSpinner } from "@/components/ui/Spinner";

export default function TeacherCoursesPage() {
  const { checked } = useRoleGuard(["teacher", "admin"]);
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
    if (checked) load();
  }, [checked]);

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

  if (!checked) return <FullPageSpinner />;
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-header">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">My courses</h1>
          <p className="mt-2 text-sm text-slate-400">Create, edit, and organize your course content.</p>
        </div>
        <Button onClick={() => router.push("/teacher/courses/create")}>
          <Plus size={16} /> New course
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start teaching students."
          action={
            <Button onClick={() => router.push("/teacher/courses/create")}>
              <Plus size={16} /> Create course
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="surface-card card-hover flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-900 sm:h-16 sm:w-24">
                {course.thumbnail_url ? (
                  <Image src={course.thumbnail_url} alt={course.title} width={180} height={120} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen size={22} className="text-slate-600" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-white">{course.title}</h3>
                {course.description && <p className="mt-1 line-clamp-1 text-sm text-slate-400">{course.description}</p>}
                <p className="mt-1 text-xs text-slate-500">Created {formatDate(course.created_at)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Button size="sm" variant="ghost" onClick={() => router.push(`/courses/${course.id}`)}>
                  <Eye size={14} />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => router.push(`/teacher/courses/${course.id}/lessons/create`)}>
                  <Plus size={14} /> Lesson
                </Button>
                <Button size="sm" variant="secondary" onClick={() => router.push(`/teacher/courses/${course.id}/edit`)}>
                  <Edit size={14} />
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteModal(course)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete course" size="sm">
        <p className="mb-6 text-sm leading-6 text-slate-400">
          Are you sure you want to delete <span className="font-medium text-white">{deleteModal?.title}</span>? This will also delete all lessons and enrollments.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
