"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { StudentDashboardData } from "@/types";
import StatCard from "@/components/cards/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStudentDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!data) return null;

  const completed = data.courses.filter((c) => c.progress === 100).length;
  const avgProgress = data.courses.length > 0 ? Math.round(data.courses.reduce((sum, c) => sum + c.progress, 0) / data.courses.length) : 0;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Enrolled" value={data.total_enrolled} icon={BookOpen} color="violet" />
        <StatCard title="Completed" value={completed} icon={Trophy} color="green" subtitle="Mastery achieved" />
        <StatCard title="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} color="blue" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Learning Journey</h2>
            <p className="text-sm text-zinc-500 font-medium">Pick up right where you left off.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>Explore Library</Button>
        </div>

        {data.courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="Your library is empty" description="Embark on your next learning adventure today." action={<Button onClick={() => router.push("/courses")}>Discover Courses</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.courses.map((course) => (
              <div key={course.course_id} className="glass-card group p-6 rounded-4xl hover:border-violet-500/20 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-400 transition-colors">{course.course_title}</h3>
                    <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Lead Mentor: {course.teacher_name}</p>
                    <div className="mt-6">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                        <span>Course Milestone</span>
                        <span>{course.completed_lessons} / {course.total_lessons} Lessons</span>
                      </div>
                      <ProgressBar value={course.progress} showLabel={false} size="sm" className="h-1.5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end md:self-center">
                    {course.progress === 100 && <Trophy size={20} className="text-emerald-500 animate-pulse" />}
                    <Button className="rounded-2xl" onClick={() => router.push(`/courses/${course.course_id}/learn`)}>
                      Resume <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}