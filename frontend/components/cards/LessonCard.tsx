"use client";

import {
  PlayCircle,
  FileText,
  ExternalLink,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Lesson } from "@/types";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: Lesson;
  completed?: boolean;
  onClick?: () => void;
  actionSlot?: React.ReactNode;
}

export default function LessonCard({
  lesson,
  completed = false,
  onClick,
  actionSlot,
}: LessonCardProps) {
  const hasVideo = lesson.video_url || lesson.external_video_link;

  return (
    <div
      className={cn(
        "group flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300",
        "bg-[#0c0c0e] border-white/5 hover:border-violet-500/20 hover:bg-white/20",
        onClick && "cursor-pointer active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      {/* completion icon */}
      <div className="mt-1 shrink-0">
        {completed ? (
          <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
        ) : (
          <div className="p-1 rounded-full bg-white/5 border border-white/10 group-hover:border-violet-500/30 transition-colors">
            <Circle size={18} className="text-zinc-600 group-hover:text-violet-400" />
          </div>
        )}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-black tracking-[0.2em] text-zinc-600 uppercase">
              Lesson {lesson.order + 1}
            </span>
            <h4 className="font-bold text-white mt-1 group-hover:text-violet-300 transition-colors leading-tight">
              {lesson.title}
            </h4>
            {lesson.description && (
              <p className="text-sm text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                {lesson.description}
              </p>
            )}
          </div>
        </div>

        {/* media indicators */}
        <div className="flex items-center gap-4 mt-4">
          {hasVideo && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              <PlayCircle size={14} />
              Video
            </span>
          )}
          {lesson.pdf_url && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              <FileText size={14} />
              PDF Resource
            </span>
          )}
          {lesson.external_video_link && !lesson.video_url && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
              <ExternalLink size={14} />
              External
            </span>
          )}
        </div>
      </div>

      {actionSlot && (
        <div className="shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
          {actionSlot}
        </div>
      )}
    </div>
  );
}