"use client";

import { useState } from "react";
import { ImagePlus, CloudUpload } from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/TextArea";
import Button from "@/components/ui/Button";
import { Course } from "@/types";
import Image from "next/image";

interface CourseFormProps {
  initial?: Partial<Course>;
  onSubmit: (data: {
    title: string;
    description: string;
    thumbnail: File | null;
  }) => Promise<void>;
  submitLabel?: string;
}

export default function CourseForm({
  initial,
  onSubmit,
  submitLabel = "Create Course",
}: CourseFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.thumbnail_url || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(file);
    setPreview(URL.createObjectURL(file));
  };

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
      await onSubmit({ title, description, thumbnail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Course Title"
        placeholder="e.g. Mastering Advanced React"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <Textarea
        label="Course Description"
        placeholder="Provide an overview of the curriculum..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 px-1">
          Thumbnail Image
        </label>
        <label className="cursor-pointer group">
          <div className="w-full h-52 bg-[#0c0c0e] border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center group-hover:border-violet-500/40 group-hover:bg-violet-500/5 transition-all duration-300 overflow-hidden relative">
            {preview ? (
              <>
                <Image src={preview} alt="preview" width={400} height={200} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <CloudUpload className="text-white" size={32} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                  <ImagePlus size={32} />
                </div>
                <div className="text-center">
                  <span className="block text-sm font-semibold text-zinc-300">Click to upload</span>
                  <span className="text-[10px] uppercase tracking-wider">PNG, JPG up to 5MB</span>
                </div>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <Button type="submit" loading={loading} fullWidth className="mt-4 py-4">
        {submitLabel}
      </Button>
    </form>
  );
}