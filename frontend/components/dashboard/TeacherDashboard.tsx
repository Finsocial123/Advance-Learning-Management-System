"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  PlaySquare,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { TeacherDashboardData } from "@/types";
import { getApiErrorMessage } from "@/lib/api";
import StatCard from "@/components/cards/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function TeacherDashboard() {
  const router = useRouter();

  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setError("");

        const dashboard = await dashboardService.getTeacherDashboard();

        if (mounted) {
          setData(dashboard);
        }
      } catch (err) {
        if (mounted) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5 text-rose-100">
        <h3 className="font-bold">Teacher dashboard could not load</h3>

        <p className="mt-2 text-sm text-rose-200/90">{error}</p>

        <Button
          className="mt-4"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const courses = data.courses ?? [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 duration-700">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          title="Active Courses"
          value={data.total_courses}
          icon={BookOpen}
          color="violet"
        />

        <StatCard
          title="Total Modules"
          value={data.total_lessons}
          icon={PlaySquare}
          color="blue"
        />

        <StatCard
          title="Students"
          value={data.total_enrolled_students}
          icon={Users}
          color="green"
        />
      </div>

      <section>
        <div className="mb-8 flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Curriculum Manager
          </h2>

          <Button size="sm" onClick={() => router.push("/teacher/courses/create")}>
            <Plus size={16} className="mr-1" /> New Curriculum
          </Button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-slate-300">
            <h3 className="font-semibold text-white">No courses created yet</h3>

            <p className="mt-2 text-sm text-slate-400">
              Create your first course to start seeing lessons, enrollments, and
              student progress here.
            </p>

            <Button
              className="mt-4"
              size="sm"
              onClick={() => router.push("/teacher/courses/create")}
            >
              <Plus size={16} className="mr-1" /> Create Course
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => {
              const students = course.students ?? [];

              return (
                <div
                  key={course.course_id}
                  className="glass-card group overflow-hidden rounded-[2rem] border-white/5 transition-all duration-300 hover:border-violet-500/20"
                >
                  <div
                    className="flex w-full cursor-pointer flex-col justify-between px-8 py-6 md:flex-row md:items-center"
                    onClick={() =>
                      setExpandedCourse(
                        expandedCourse === course.course_id
                          ? null
                          : course.course_id
                      )
                    }
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white transition-colors group-hover:text-violet-400">
                        {course.course_title}
                      </h3>

                      <div className="mt-2 flex items-center gap-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          {course.total_lessons} Lessons
                        </span>

                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          {course.total_enrolled} Students
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 md:mt-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/teacher/courses/${course.course_id}/lessons/create`
                          );
                        }}
                      >
                        <Plus size={14} className="mr-1" /> Add Lesson
                      </Button>

                      <div className="rounded-full bg-white/5 p-2 text-zinc-500">
                        {expandedCourse === course.course_id ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedCourse === course.course_id && (
                    <div className="animate-in slide-in-from-top-2 border-t border-white/5 bg-white/[0.01] px-8 pb-8 pt-4 duration-300">
                      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Engagement Analytics
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[10px]"
                            onClick={() =>
                              router.push(
                                `/teacher/courses/${course.course_id}/students`
                              )
                            }
                          >
                            <Users size={12} className="mr-1" /> Student Report
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px]"
                            onClick={() =>
                              router.push(
                                `/teacher/courses/${course.course_id}/edit`
                              )
                            }
                          >
                            <Edit3 size={12} className="mr-1" /> Edit Course
                          </Button>
                        </div>
                      </div>

                      {students.length === 0 ? (
                        <p className="text-sm italic text-zinc-600">
                          No student engagement recorded yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                          {students.map((student) => (
                            <div key={student.student_id} className="space-y-2">
                              <div className="flex items-end justify-between">
                                <span className="text-xs font-bold text-zinc-300">
                                  {student.student_name}
                                </span>

                                <span className="text-[10px] font-black text-violet-400">
                                  {student.progress}%
                                </span>
                              </div>

                              <ProgressBar
                                value={student.progress}
                                showLabel={false}
                                size="sm"
                                className="h-1"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}