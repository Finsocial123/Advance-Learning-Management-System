"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { AdminDashboardData } from "@/types";
import StatCard from "@/components/cards/StatCard";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState<number | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  // 🔥 Toggle sections here instead of commenting code
  const SHOW_TEACHERS = false;
  const SHOW_STUDENTS = false;

  useEffect(() => {
    dashboardService.getAdminDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );

  if (!data) return null;

  const hasSections = SHOW_TEACHERS || SHOW_STUDENTS;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={data.total_users} icon={Users} color="violet" />
        <StatCard title="Teachers" value={data.total_teachers} icon={GraduationCap} color="blue" />
        <StatCard title="Students" value={data.total_students} icon={Users} color="green" />
        <StatCard title="Courses" value={data.total_courses} icon={BookOpen} color="orange" />
      </div>

      {/* Dynamic Content Area */}
      <div
        className={cn(
          "grid gap-10",
          hasSections ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
        )}
      >
        {/* Teachers Section */}
        {SHOW_TEACHERS && (
          <section>
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <GraduationCap size={20} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Active Faculty
              </h2>
            </div>

            <div className="space-y-3">
              {data.teachers.map((t) => (
                <div
                  key={t.teacher_id}
                  className="glass-card rounded-2xl overflow-hidden group transition-all duration-300"
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors text-left"
                    onClick={() =>
                      setExpandedTeacher(
                        expandedTeacher === t.teacher_id ? null : t.teacher_id
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-black text-blue-400 border border-blue-500/20">
                        {t.teacher_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {t.teacher_name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          {t.teacher_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {t.total_courses} Courses
                      </span>
                      {expandedTeacher === t.teacher_id ? (
                        <ChevronUp size={16} className="text-zinc-400" />
                      ) : (
                        <ChevronDown size={16} className="text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {expandedTeacher === t.teacher_id && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-wrap gap-2 mt-4">
                        {t.courses.map((c, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[11px] font-bold text-zinc-400 uppercase tracking-tight"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Students Section */}
        {SHOW_STUDENTS && (
          <section>
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Student Body
              </h2>
            </div>

            <div className="space-y-3">
              {data.students.map((s) => (
                <div
                  key={s.student_id}
                  className="glass-card rounded-2xl overflow-hidden group transition-all duration-300"
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors text-left"
                    onClick={() =>
                      setExpandedStudent(
                        expandedStudent === s.student_id ? null : s.student_id
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-sm font-black text-emerald-400 border border-emerald-500/20">
                        {s.student_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {s.student_name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          {s.student_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {s.total_enrolled} Enrolled
                      </span>
                      {expandedStudent === s.student_id ? (
                        <ChevronUp size={16} className="text-zinc-400" />
                      ) : (
                        <ChevronDown size={16} className="text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {expandedStudent === s.student_id && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-wrap gap-2 mt-4">
                        {s.enrolled_courses.map((c, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[11px] font-bold text-zinc-400 uppercase tracking-tight"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fallback when nothing is enabled */}
        {!hasSections && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
            <p className="text-lg font-semibold">No detailed data to display</p>
            <p className="text-sm mt-2">
              Enable sections when needed or add new dashboard widgets here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}