"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Users, ArrowRight, PlayCircle, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { courseService } from "@/services/course.service";
import { Course } from "@/types";
import CourseCard from "@/components/cards/CourseCard";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseService.getAll().then((data) => setCourses(data.slice(0, 6)));
  }, []);

  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-violet-600/5 blur-[120px] -z-10 rounded-full" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-violet-300 text-xs font-semibold mb-8 backdrop-blur-md">
          <Sparkles size={14} className="text-violet-400" />
          The future of digital education
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-white mb-8 tracking-tight leading-[1.1]">
          Master your craft <br />
          <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            without boundaries
          </span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
          Experience a seamless learning journey with expert-led courses, real-time tracking, 
          and a community built for growth.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {isAuthenticated ? (
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-violet-500/20" onClick={() => router.push("/dashboard")}>
              Go to Dashboard <ArrowRight size={18} />
            </Button>
          ) : (
            <>
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-violet-500/20" onClick={() => router.push("/register")}>
                Start Learning Now <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => router.push("/login")}>
                Sign In
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[
          { icon: BookOpen, title: "Curated Content", desc: "Access high-quality videos, PDFs, and hands-on resources built for mastery.", color: "from-violet-500/20" },
          { icon: GraduationCap, title: "Elite Mentors", desc: "Learn directly from industry experts vetted by our global admin network.", color: "from-blue-500/20" },
          { icon: Users, title: "Progress Tracking", desc: "Detailed analytics and milestones to keep you motivated and on schedule.", color: "from-emerald-500/20" },
        ].map((f, i) => (
          <div key={i} className="group glass-card p-8 rounded-4xl hover:border-zinc-700 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${f.color} to-transparent border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <f.icon size={26} className="text-zinc-100" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Course List Section */}
      {courses.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-10 px-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Courses</h2>
              <p className="text-zinc-500">Hand-picked excellence from our top instructors.</p>
            </div>
            <Link href="/courses" className="flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-all group">
              Explore All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course.id} className="hover:-translate-y-2 transition-transform duration-300">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="relative overflow-hidden glass-card mx-4 p-12 rounded-[2.5rem] text-center border border-violet-500/20">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full" />
          <h2 className="text-3xl font-bold text-white mb-4">Transform your career today</h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto italic">The best investment you can make is in yourself</p>
          <Button size="lg" className="rounded-full px-10" onClick={() => router.push("/register")}>
            Join LearnHub for Free
          </Button>
        </section>
      )}
    </div>
  );
}