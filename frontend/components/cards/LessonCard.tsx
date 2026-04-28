"use client";

import { CheckCircle2, Circle, ExternalLink, FileText, PlayCircle } from "lucide-react";
import { Lesson } from "@/types";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: Lesson;
  completed?: boolean;
  onClick?: () => void;
  actionSlot?: React.ReactNode;
}

export default function LessonCard({ lesson, completed = false, onClick, actionSlot }: LessonCardProps) {
  const hasVideo = lesson.video_url || lesson.external_video_link;

  return (
    <div
      className={cn(
        "surface-card card-hover group flex items-start gap-4 rounded-2xl p-4 sm:p-5",
        onClick && "cursor-pointer active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      <div className="mt-1 shrink-0">
        {completed ? (
          <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 p-1">
            <CheckCircle2 size={18} className="text-emerald-300" />
          </div>
        ) : (
          <div className="rounded-full border border-slate-700 bg-slate-900/70 p-1 transition-colors group-hover:border-indigo-400/40">
            <Circle size={18} className="text-slate-600 transition-colors group-hover:text-indigo-300" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Lesson {lesson.order + 1}
        </span>
        <h4 className="mt-1 font-semibold leading-tight text-white transition-colors group-hover:text-indigo-200">
          {lesson.title}
        </h4>
        {lesson.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{lesson.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasVideo && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-200">
              <PlayCircle size={13} /> Video
            </span>
          )}
          {lesson.pdf_url && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-sky-200">
              <FileText size={13} /> PDF
            </span>
          )}
          {lesson.external_video_link && !lesson.video_url && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-200">
              <ExternalLink size={13} /> External
            </span>
          )}
        </div>
      </div>

      {actionSlot && (
        <div className="shrink-0 self-center" onClick={(event) => event.stopPropagation()}>
          {actionSlot}
        </div>
      )}
    </div>
  );
}
