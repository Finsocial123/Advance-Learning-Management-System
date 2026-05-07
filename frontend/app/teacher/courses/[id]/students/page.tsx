"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Mail,
  Search,
  UserRound,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { courseService } from "@/services/course.service";
import {
  CourseStudentProgressReport,
  CourseStudentsProgressResponse,
} from "@/types";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { cn, formatDate, formatDateTime, getErrorMessage } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import ProgressBar from "@/components/ui/ProgressBar";
import Spinner, { FullPageSpinner } from "@/components/ui/Spinner";

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getProgressBadge(progress: number) {
  if (progress >= 100) return { label: "Completed", variant: "success" as const };
  if (progress >= 50) return { label: "In progress", variant: "warning" as const };
  return { label: "Started", variant: "default" as const };
}

export default function CourseStudentsProgressPage() {
  const { checked } = useRoleGuard(["teacher", "admin"]);
  const { id } = useParams();
  const router = useRouter();
  const courseId = Number(id);

  const [report, setReport] = useState<CourseStudentsProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  useEffect(() => {
    if (!checked || !courseId) return;

    const loadReport = async () => {
      try {
        const data = await courseService.getStudentsProgressReport(courseId);
        setReport(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [checked, courseId]);

  const filteredStudents = useMemo(() => {
    const students = report?.students ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) return students;

    return students.filter((student) =>
      [student.student_name, student.student_email]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [report?.students, search]);

  if (!checked) return <FullPageSpinner />;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="page-shell">
      <div className="section-header">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => router.push("/teacher/courses")}
          >
            <ArrowLeft size={16} /> Back to courses
          </Button>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Student Progress Report
              </h1>
              <Badge label="course-wise" />
            </div>
            <p className="max-w-2xl text-sm text-slate-400">
              {report.course.title} — view every enrolled student and their lesson completion status for this course.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Students</p>
            <Users size={18} className="text-indigo-300" />
          </div>
          <p className="mt-4 text-3xl font-black text-white">{report.total_students}</p>
          <p className="mt-1 text-xs text-slate-500">Enrolled in this course</p>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Average Progress</p>
            <BookOpen size={18} className="text-indigo-300" />
          </div>
          <p className="mt-4 text-3xl font-black text-white">{Math.round(report.average_progress)}%</p>
          <ProgressBar value={report.average_progress} showLabel={false} size="sm" className="mt-3" />
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Course Owner</p>
            <UserRound size={18} className="text-indigo-300" />
          </div>
          <p className="mt-4 truncate text-lg font-bold text-white">
            {report.course.teacher_name || "Unknown Teacher"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Created {formatDate(report.course.created_at)}</p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">Enrolled students</h2>
            <p className="mt-1 text-xs text-slate-500">
              Click any student to open their lesson-by-lesson report.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {report.students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students enrolled yet"
          description="Students will appear here after they enroll in this course."
        />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching students"
          description="Try searching by another name or email."
        />
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const expanded = expandedStudentId === student.student_id;
            const badge = getProgressBadge(student.progress);

            return (
              <StudentProgressCard
                key={student.student_id}
                student={student}
                expanded={expanded}
                badge={badge}
                onToggle={() =>
                  setExpandedStudentId(expanded ? null : student.student_id)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentProgressCard({
  student,
  expanded,
  badge,
  onToggle,
}: {
  student: CourseStudentProgressReport;
  expanded: boolean;
  badge: { label: string; variant: "success" | "warning" | "default" };
  onToggle: () => void;
}) {
  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-5 p-5 text-left transition-colors hover:bg-slate-900/35 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-sm font-black text-indigo-200">
            {student.student_name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-white">{student.student_name}</h3>
              <Badge label={badge.label} variant={badge.variant} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={13} /> {student.student_email}
              </span>
              <span>Enrolled {formatDate(student.enrolled_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400">
              {student.completed_lessons}/{student.total_lessons} lessons completed
            </span>
            <span className="font-black text-indigo-200">{Math.round(student.progress)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <ProgressBar value={student.progress} showLabel={false} size="sm" />
            <span className="rounded-full bg-slate-900/80 p-1 text-slate-400">
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/25 p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniMetric label="Completed" value={student.completed_lessons} />
            <MiniMetric label="Pending" value={student.pending_lessons} />
            <MiniMetric label="Total lessons" value={student.total_lessons} />
          </div>

          {student.lessons.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-slate-950/35 p-4 text-sm text-slate-500">
              No lessons have been added to this course yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800/80">
              <div className="hidden grid-cols-[70px_1fr_140px_190px] border-b border-slate-800 bg-slate-950/40 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 md:grid">
                <span>Order</span>
                <span>Lesson</span>
                <span>Status</span>
                <span>Video watch</span>
              </div>

              <div className="divide-y divide-slate-800/70">
                {student.lessons.map((lesson) => {
                  const watchPercentage = lesson.video_duration_seconds
                    ? Math.min((lesson.watched_seconds / lesson.video_duration_seconds) * 100, 100)
                    : 0;

                  return (
                    <div
                      key={lesson.lesson_id}
                      className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[70px_1fr_140px_190px] md:items-center"
                    >
                      <span className="text-xs font-bold text-slate-500">#{lesson.order}</span>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">{lesson.title}</p>
                        {lesson.completed_at && (
                          <p className="mt-1 text-xs text-slate-500">
                            Completed {formatDateTime(lesson.completed_at)}
                          </p>
                        )}
                      </div>

                      <div>
                        {lesson.completed ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                            <CheckCircle2 size={13} /> Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            <XCircle size={13} /> Pending
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {lesson.has_video ? (
                          <>
                            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Video size={12} /> {Math.round(watchPercentage)}%
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 size={12} /> {formatDuration(lesson.watched_seconds)}
                              </span>
                            </div>
                            <ProgressBar value={watchPercentage} showLabel={false} size="sm" />
                          </>
                        ) : (
                          <span className="text-xs text-slate-600">No video</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn("rounded-xl border border-slate-800 bg-slate-950/35 p-4")}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
