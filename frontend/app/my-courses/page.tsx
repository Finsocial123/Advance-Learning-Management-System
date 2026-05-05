"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Trophy, TrendingUp } from "lucide-react";
import { enrollmentService } from "@/services/enrollment.service";
import { Enrollment } from "@/types";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";

export default function StudentCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentService
      .getMyEnrollments()
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, []);

  const completed = enrollments.filter((e) => e.progress === 100).length;
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + e.progress, 0) /
            enrollments.length
        )
      : 0;

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="surface-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-300">
              <BookOpen size={14} /> My Courses
            </div>
            <h1 className="page-heading">My Enrolled Courses</h1>
            <p className="page-subtitle mt-3 max-w-2xl">
              Track your progress and continue learning right where you left
              off.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push("/courses")}
            className="shrink-0"
          >
            Browse More Courses <ArrowRight size={15} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No enrolled courses yet"
          description="Start your learning journey by browsing and enrolling in a course."
          action={
            <Button onClick={() => router.push("/courses")}>
              Discover Courses <ArrowRight size={15} />
            </Button>
          }
        />
      ) : (
        <>
          {/* Stats strip */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="surface-card flex items-center gap-4 rounded-2xl p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <BookOpen size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Enrolled
                </p>
                <p className="text-2xl font-bold text-white">
                  {enrollments.length}
                </p>
              </div>
            </div>
            <div className="surface-card flex items-center gap-4 rounded-2xl p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Trophy size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Completed
                </p>
                <p className="text-2xl font-bold text-white">{completed}</p>
              </div>
            </div>
            <div className="surface-card flex items-center gap-4 rounded-2xl p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                <TrendingUp size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Avg Progress
                </p>
                <p className="text-2xl font-bold text-white">{avgProgress}%</p>
              </div>
            </div>
          </div>

          {/* Course list */}
          <div className="grid grid-cols-1 gap-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment_id}
                className="surface-card group flex flex-col gap-6 rounded-2xl p-6 transition-colors hover:border-indigo-500/20 md:flex-row md:items-center"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1 truncate text-lg font-bold text-white transition-colors group-hover:text-indigo-300">
                    {enrollment.course_title}
                  </h3>
                  {enrollment.teacher_name && (
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Instructor: {enrollment.teacher_name}
                    </p>
                  )}

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span>Progress</span>
                      <span>{enrollment.progress}%</span>
                    </div>
                    <ProgressBar
                      value={enrollment.progress}
                      showLabel={false}
                      size="sm"
                      className="h-1.5"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-4 self-end md:self-center">
                  {enrollment.progress === 100 && (
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      <Trophy size={12} />
                      Completed
                    </div>
                  )}
                  <Button
                    onClick={() =>
                      router.push(`/courses/${enrollment.course_id}/learn`)
                    }
                    className="rounded-xl"
                  >
                    {enrollment.progress === 0
                      ? "Start"
                      : enrollment.progress === 100
                      ? "Review"
                      : "Continue"}{" "}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}