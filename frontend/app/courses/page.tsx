"use client";

import { useEffect, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { courseService } from "@/services/course.service";
import { Course } from "@/types";
import CourseCard from "@/components/cards/CourseCard";
import Input from "@/components/ui/Input";
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

  useEffect(() => {
    const delay = setTimeout(() => fetchCourses(search), 400);
    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">All Courses</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Browse and enroll in available courses
        </p>
      </div>

      {/* search */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={
            search
              ? `No results for "${search}". Try a different search.`
              : "No courses available yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}