"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, TrendingUp } from "lucide-react";
import { courseService } from "@/services/course.service";
import { Course } from "@/types";
import CourseCard from "@/components/cards/CourseCard";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseService.getAll().then((data) => setCourses(data.slice(0, 6)));
  }, []);

  return (
    <div className="space-y-12 pb-12">
      <section className="surface-card overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <ShieldCheck size={14} /> Modern learning management
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn, teach, and manage courses from one clean dashboard.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
              A dark, focused LMS experience for students, teachers, and admins with courses, lessons, progress, and assignments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button size="lg" onClick={() => router.push("/dashboard")}>
                  Go to dashboard <ArrowRight size={18} />
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => router.push("/register")}>
                    Start learning <ArrowRight size={18} />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push("/login")}>
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Courses", "Browse structured lessons"],
              ["Progress", "Track every milestone"],
              ["Roles", "Student, teacher, admin"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
                <p className="text-lg font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: BookOpen, title: "Course library", desc: "Clean course cards, lessons, PDFs, and videos." },
          { icon: GraduationCap, title: "Teacher tools", desc: "Create, edit, and manage courses without clutter." },
          { icon: TrendingUp, title: "Progress tracking", desc: "Give students and teachers clear learning visibility." },
        ].map((feature) => (
          <div key={feature.title} className="surface-card card-hover rounded-2xl p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-200">
              <feature.icon size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </section>

      {courses.length > 0 && (
        <section>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Featured courses</h2>
              <p className="mt-1 text-sm text-slate-400">A quick preview of the learning catalog.</p>
            </div>
            <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200">
              Explore all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
