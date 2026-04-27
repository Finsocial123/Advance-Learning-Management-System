"use client";

import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { lessonService } from "@/services/lesson.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage } from "@/lib/utils";
import LessonForm from "@/components/forms/LessonForm";
import Button from "@/components/ui/Button";

export default function CreateLessonPage() {
  useRoleGuard(["teacher", "admin"]);
  const { id } = useParams();
  const router = useRouter();
  const courseId = Number(id);

  const handleCreate = async (data: {
    title: string;
    description: string;
    order: number;
    external_video_link: string;
    video: File | null;
    pdf: File | null;
  }) => {
    try {
      await lessonService.create(courseId, data);
      toast.success("Lesson created!");
      router.push(`/courses/${courseId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
          <ArrowLeft size={16} />
          Back to Course
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Add Lesson</h1>
          <p className="text-sm text-zinc-500">
            Upload content for this lesson
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <LessonForm onSubmit={handleCreate} submitLabel="Create Lesson" />
      </div>
    </div>
  );
}