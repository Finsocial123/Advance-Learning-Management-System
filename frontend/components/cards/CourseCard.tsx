"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, Calendar, Play, User } from "lucide-react";
import { Course } from "@/types";
import { formatDate } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  showTeacher?: boolean;
  actionSlot?: React.ReactNode;
}

export default function CourseCard({
  course,
  showTeacher = true,
  actionSlot,
}: CourseCardProps) {
  const router = useRouter();

  return (
    <article className="surface-card card-hover group flex h-full flex-col overflow-hidden rounded-2xl">
      <button
        type="button"
        className="relative h-48 w-full overflow-hidden bg-slate-950 text-left"
        onClick={() => router.push(`/courses/${course.id}`)}
      >
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-black">
            <BookOpen size={46} className="text-slate-800" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/78 via-black/20 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-200 backdrop-blur-md">
          Course
        </span>
        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white opacity-0 shadow-xl backdrop-blur-md transition-opacity group-hover:opacity-100">
          <Play size={18} fill="currentColor" />
        </span>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <button
          type="button"
          className="mb-2 line-clamp-2 text-left text-lg font-semibold leading-snug tracking-tight text-white transition-colors hover:text-indigo-200"
          onClick={() => router.push(`/courses/${course.id}`)}
        >
          {course.title}
        </button>

        {course.description && (
          <p className="mb-5 line-clamp-2 text-sm leading-6 text-slate-400">
            {course.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-800/90 pt-4">
          <div className="min-w-0 space-y-1.5">
            {showTeacher && course.teacher_name && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <User size={13} className="text-indigo-300" />
                <span className="truncate">{course.teacher_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={13} />
              <span>{formatDate(course.created_at)}</span>
            </div>
          </div>
        </div>

        {actionSlot && (
          <div className="mt-4 border-t border-slate-800/90 pt-4">
            {actionSlot}
          </div>
        )}
      </div>
    </article>
  );
}
