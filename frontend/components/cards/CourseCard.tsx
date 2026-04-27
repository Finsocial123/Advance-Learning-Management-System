"use client";

import { useRouter } from "next/navigation";
import { BookOpen, User, Calendar, Play } from "lucide-react";
import { Course } from "@/types";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

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
    <div className="group bg-[#0c0c0e] border border-white/5 rounded-4xl overflow-hidden hover:border-violet-500/30 transition-all duration-500 flex flex-col shadow-2xl hover:shadow-violet-500/10">
      {/* thumbnail */}
      <div
        className="relative h-52 bg-zinc-900 overflow-hidden cursor-pointer"
        onClick={() => router.push(`/courses/${course.id}`)}
      >
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-zinc-900 to-black">
            <BookOpen size={48} className="text-zinc-800" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
        
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
           <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
              <Play size={20} fill="currentColor" />
           </div>
        </div>
      </div>

      {/* content */}
      <div className="p-6 flex flex-col flex-1">
        <h3
          className="text-lg font-bold text-white mb-2 line-clamp-2 cursor-pointer hover:text-violet-400 transition-colors tracking-tight leading-snug"
          onClick={() => router.push(`/courses/${course.id}`)}
        >
          {course.title}
        </h3>

        {course.description && (
          <p className="text-sm text-zinc-500 line-clamp-2 mb-6 font-medium leading-relaxed">
            {course.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="space-y-1.5">
            {showTeacher && course.teacher_name && (
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <User size={10} className="text-violet-400" />
                </div>
                <span>{course.teacher_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              <Calendar size={12} />
              <span>{formatDate(course.created_at)}</span>
            </div>
          </div>
        </div>

        {actionSlot && (
          <div className="mt-6 pt-5 border-t border-white/5">{actionSlot}</div>
        )}
      </div>
    </div>
  );
}