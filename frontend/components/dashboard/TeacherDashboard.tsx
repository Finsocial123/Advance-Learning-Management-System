"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, PlaySquare, ChevronDown, ChevronUp, Plus, Edit3 } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { TeacherDashboardData } from "@/types";
import StatCard from "@/components/cards/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function TeacherDashboard() {
  const router = useRouter();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  useEffect(() => {
    dashboardService.getTeacherDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Active Courses" value={data.total_courses} icon={BookOpen} color="violet" />
        <StatCard title="Total Modules" value={data.total_lessons} icon={PlaySquare} color="blue" />
        <StatCard title="Students" value={data.total_enrolled_students} icon={Users} color="green" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Curriculum Manager</h2>
          <Button size="sm" onClick={() => router.push("/teacher/courses/create")}>
            <Plus size={16} className="mr-1" /> New Curriculum
          </Button>
        </div>

        <div className="space-y-4">
          {data.courses.map((course) => (
            <div key={course.course_id} className="glass-card rounded-4xl overflow-hidden group border-white/5 hover:border-violet-500/20 transition-all duration-300">
              <div 
                className="w-full flex flex-col md:flex-row md:items-center justify-between px-8 py-6 cursor-pointer"
                onClick={() => setExpandedCourse(expandedCourse === course.course_id ? null : course.course_id)}
              >
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{course.course_title}</h3>
                  <div className="flex items-center gap-6 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{course.total_lessons} Lessons</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{course.total_enrolled} Students</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <Button variant="secondary" size="sm" className="rounded-xl h-9" onClick={(e) => { e.stopPropagation(); router.push(`/teacher/courses/${course.course_id}/lessons/create`); }}>
                    <Plus size={14} className="mr-1" /> Add Lesson
                  </Button>
                  <div className="p-2 rounded-full bg-white/5 text-zinc-500">
                    {expandedCourse === course.course_id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {expandedCourse === course.course_id && (
                <div className="px-8 pb-8 pt-4 border-t border-white/5 bg-white/1 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Engagement Analytics</p>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => router.push(`/teacher/courses/${course.course_id}/edit`)}>
                      <Edit3 size={12} className="mr-1" /> Edit Course
                    </Button>
                  </div>
                  {course.students.length === 0 ? (
                    <p className="text-sm text-zinc-600 italic">No student engagement recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      {course.students.map((s) => (
                        <div key={s.student_id} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-zinc-300">{s.student_name}</span>
                            <span className="text-[10px] font-black text-violet-400">{s.progress}%</span>
                          </div>
                          <ProgressBar value={s.progress} showLabel={false} size="sm" className="h-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}