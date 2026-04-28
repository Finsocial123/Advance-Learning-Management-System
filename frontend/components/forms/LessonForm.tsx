"use client";

import { useState } from "react";
import { FileVideo, FileText, LayoutGrid, Link as LinkIcon } from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/TextArea";
import Button from "@/components/ui/Button";
import { Lesson } from "@/types";
import { cn } from "@/lib/utils";

interface LessonFormProps {
  initial?: Partial<Lesson>;
  onSubmit: (data: {
    title: string;
    description: string;
    order: number;
    external_video_link: string;
    video: File | null;
    pdf: File | null;
  }) => Promise<void>;
  submitLabel?: string;
}

export default function LessonForm({
  initial,
  onSubmit,
  submitLabel = "Create Lesson",
}: LessonFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [externalLink, setExternalLink] = useState(initial?.external_video_link || "");
  const [video, setVideo] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const validate = () => {
    const e: { title?: string } = {};
    if (!title.trim()) e.title = "Title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, order, external_video_link: externalLink, video, pdf });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Input
            label="Lesson Title"
            placeholder="e.g. 01. Introduction to the Module"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />
        </div>
        <Input
          label="Display Order"
          type="number"
          min={0}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          hint="0 = First lesson"
        />
      </div>

      <Textarea
        label="Lesson Content / Summary"
        placeholder="Provide a brief overview for students..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />

      <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-6">
        <Input
          label="External Video URL"
          placeholder="https://youtube.com/..."
          value={externalLink}
          onChange={(e) => setExternalLink(e.target.value)}
          className="bg-transparent"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Video upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Video Asset</label>
            <label className="cursor-pointer group block">
              <div className={cn(
                "w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300",
                video ? "border-violet-500/50 bg-violet-500/5" : "border-white/5 bg-white/5 hover:border-violet-500/30"
              )}>
                <FileVideo size={24} className={video ? "text-violet-400" : "text-zinc-500 group-hover:text-violet-400"} />
                <span className="text-[11px] font-medium text-zinc-400 px-4 text-center truncate w-full">
                  {video ? video.name : "Native MP4/WebM"}
                </span>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
            </label>
          </div>

          {/* PDF upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Course PDF</label>
            <label className="cursor-pointer group block">
              <div className={cn(
                "w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300",
                pdf ? "border-blue-500/50 bg-blue-500/5" : "border-white/5 bg-white/5 hover:border-blue-500/30"
              )}>
                <FileText size={24} className={pdf ? "text-blue-400" : "text-zinc-500 group-hover:text-blue-400"} />
                <span className="text-[11px] font-medium text-zinc-400 px-4 text-center truncate w-full">
                  {pdf ? pdf.name : "Resource Document"}
                </span>
              </div>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setPdf(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
      </div>

      <Button type="submit" loading={loading} fullWidth className="py-4">
        {submitLabel}
      </Button>
    </form>
  );
}