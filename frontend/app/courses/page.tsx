"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { courseService } from "@/services/course.service";
import { Course } from "@/types";
import CourseCard from "@/components/cards/CourseCard";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCourses = async (q = "") => {
    setLoading(true);
    try {
      const data = await courseService.getAll(q || undefined);
      setCourses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourses = async (q = "") => {
    setLoading(true);
    try {
      const data = await courseService.getAll(q || undefined);
      setCourses(data);
    } finally {
      setLoading(false);
    }
  };
    fetchCourses();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses(search);
  };

  return (
    <div className="page-shell">
      <div className="surface-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-300">
              <BookOpen size={14} /> Course catalog
            </div>
            <h1 className="page-heading">Explore courses</h1>
            <p className="page-subtitle mt-3 max-w-2xl">Search and discover all available courses from your learning platform.</p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full flex  gap-4 items-center justify-center lg:max-w-md">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="h-12 w-full rounded-xl border border-slate-700/75 bg-slate-950/45 pl-10 pr-24 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/10"
            />
            <Button type="submit" size="sm" className="absolute right-1.5 top-1.5">
              Search
            </Button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try another keyword or check back when new courses are added."
          action={
            <Button variant="secondary" onClick={() => { setSearch(""); fetchCourses(); }}>
              Reset search <ArrowRight size={15} />
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
