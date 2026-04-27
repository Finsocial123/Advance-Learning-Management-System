"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { lessonService } from "@/services/lesson.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage } from "@/lib/utils";
import { Lesson } from "@/types";
import LessonForm from "@/components/forms/LessonForm";
import Button from "@/components/ui/Button";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function EditLessonPage() {
  useRoleGuard(["teacher", "admin"]);
  const { id, lessonId } = useParams();
  const router = useRouter();
  const courseId = Number(id);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lessonService
      .getById(Number(lessonId))
      .then(setLesson)
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleUpdate = async (data: any) => {
    try {
      await lessonService.update(Number(lessonId), data);
      toast.success("Lesson updated!");
      router.push(`/courses/${courseId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!lesson) return null;

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
          <h1 className="text-2xl font-bold text-zinc-100">Edit Lesson</h1>
          <p className="text-sm text-zinc-500">{lesson.title}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <LessonForm
          initial={lesson}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}