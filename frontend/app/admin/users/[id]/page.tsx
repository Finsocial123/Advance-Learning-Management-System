"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  GraduationCap,
  Mail,
  PlayCircle,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { formatDate, formatDateTime, getErrorMessage, getInitials } from "@/lib/utils";
import {
  AdminUserDetails,
  StudentCourseProgressReport,
  TeacherCourseReport,
} from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import Spinner, { FullPageSpinner } from "@/components/ui/Spinner";

export default function AdminUserDetailsPage() {
  const { checked } = useRoleGuard(["admin"]);
  const params = useParams();
  const router = useRouter();

  const [data, setData] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = Number(params.id);

  useEffect(() => {
    if (!checked || Number.isNaN(userId)) return;

    const load = async () => {
      setLoading(true);
      try {
        const details = await adminService.getUserDetails(userId);
        setData(details);
      } catch (err) {
        toast.error(getErrorMessage(err));
        router.push("/admin/users");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [checked, userId, router]);

  if (!checked) return <FullPageSpinner />;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const { user, teacher_report, student_report } = data;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/admin/users")}> 
        <ArrowLeft size={16} />
        Back to users
      </Button>

      <div className="surface-card overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-linear-to-r from-indigo-500/10 via-violet-500/5 to-sky-500/10 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={140}
                    height={140}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-slate-300">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {user.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={15} />
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Shield size={15} />
                    <Badge label={user.role} variant="role" />
                  </span>
                </div>
              </div>
            </div>

            <Badge
              label={user.is_active ? "active" : "inactive"}
              variant={user.is_active ? "success" : "danger"}
              className="self-start sm:self-center"
            />
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          <ProfileStat
            icon={UserRound}
            label="Role"
            value={user.role.toUpperCase()}
          />
          {user.role === "teacher" && (
            <ProfileStat
              icon={BookOpen}
              label="Created Courses"
              value={String(teacher_report?.total_courses ?? 0)}
            />
          )}
          {user.role === "student" && (
            <>
              <ProfileStat
                icon={BookOpen}
                label="Enrolled Courses"
                value={String(student_report?.total_enrolled_courses ?? 0)}
              />
              <ProfileStat
                icon={GraduationCap}
                label="Average Progress"
                value={`${Math.round(student_report?.average_progress ?? 0)}%`}
              />
            </>
          )}
          <ProfileStat
            icon={Shield}
            label="Account Status"
            value={user.is_active ? "ACTIVE" : "INACTIVE"}
          />
        </div>

        <div className="border-t border-white/10 px-6 py-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
            Bio
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {user.bio || "No bio added yet."}
          </p>
        </div>
      </div>

      {user.role === "teacher" && teacher_report && (
        <TeacherSection
          courses={teacher_report.courses}
          onOpenCourse={(courseId) => router.push(`/courses/${courseId}`)}
        />
      )}

      {user.role === "student" && student_report && (
        <StudentSection
          courses={student_report.courses}
          averageProgress={student_report.average_progress}
          onOpenCourse={(courseId) => router.push(`/courses/${courseId}`)}
        />
      )}

      {user.role === "admin" && (
        <EmptyState
          icon={Shield}
          title="Admin account"
          description="This page currently shows detailed course reports for teacher and student accounts."
        />
      )}
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">
        <Icon size={18} />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function TeacherSection({
  courses,
  onOpenCourse,
}: {
  courses: TeacherCourseReport[];
  onOpenCourse: (courseId: number) => void;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Teacher Courses</h2>
        <p className="mt-1 text-sm text-slate-500">
          Courses created by this teacher. Click any course to open its course page.
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses created"
          description="This teacher has not created any course yet."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.id}
              onClick={() => onOpenCourse(course.id)}
              className="surface-card card-hover cursor-pointer overflow-hidden rounded-2xl transition-colors hover:bg-white/5"
            >
              {course.thumbnail_url && (
                <div className="h-36 overflow-hidden border-b border-white/10">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    width={500}
                    height={260}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="line-clamp-2 text-base font-bold text-white">
                  {course.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                  {course.description || "No description added."}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <PlayCircle size={14} />
                    {course.total_lessons} lessons
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} />
                    {course.total_enrolled_students} students
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} />
                    {formatDate(course.created_at)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function StudentSection({
  courses,
  averageProgress,
  onOpenCourse,
}: {
  courses: StudentCourseProgressReport[];
  averageProgress: number;
  onOpenCourse: (courseId: number) => void;
}) {
  return (
    <section className="space-y-4 ">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Student Progress Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enrolled courses with lesson-wise completion status.
          </p>
        </div>
        <div className="min-w-56 rounded-2xl border border-white/10 bg-black/20 p-4">
          <ProgressBar
            value={averageProgress}
            label="Average Progress"
            size="sm"
          />
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No enrolled courses"
          description="This student has not enrolled in any course yet."
        />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <article
              key={course.course_id}
              className="surface-card overflow-hidden rounded-2xl"
            >
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenCourse(course.course_id)}
                      className="text-left text-lg font-bold text-white transition-colors hover:text-indigo-200"
                    >
                      {course.course_title}
                    </button>
                    <p className="mt-1 text-sm text-slate-500">
                      Teacher: {course.teacher_name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onOpenCourse(course.course_id)}
                  >
                    Open Course
                  </Button>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_15rem]">
                  <ProgressBar
                    value={course.progress}
                    label="Course Progress"
                  />
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <MiniStat label="Total" value={course.total_lessons} />
                    <MiniStat label="Done" value={course.completed_lessons} />
                    <MiniStat label="Pending" value={course.pending_lessons} />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {course.lessons.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500">
                    No lessons added in this course yet.
                  </div>
                ) : (
                  course.lessons.map((lesson) => (
                    <div
                      key={lesson.lesson_id}
                      className="flex items-start justify-between gap-4 px-5 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-slate-500">
                          {lesson.completed ? (
                            <CheckCircle2 size={18} className="text-emerald-300" />
                          ) : (
                            <Circle size={18} />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {lesson.order}. {lesson.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {lesson.completed
                              ? `Completed ${formatDateTime(lesson.completed_at)}`
                              : "Not completed yet"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        label={lesson.completed ? "completed" : "pending"}
                        variant={lesson.completed ? "success" : "warning"}
                      />
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
        {label}
      </p>
    </div>
  );
}
