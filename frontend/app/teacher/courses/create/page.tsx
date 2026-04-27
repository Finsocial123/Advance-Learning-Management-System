"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { courseService } from "@/services/course.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage } from "@/lib/utils";
import CourseForm from "@/components/forms/CourseForm";
import Button from "@/components/ui/Button";

export default function CreateCoursePage() {
  useRoleGuard(["teacher", "admin"]);
  const router = useRouter();

  const handleCreate = async (data: {
    title: string;
    description: string;
    thumbnail: File | null;
  }) => {
    try {
      const res = await courseService.create(data);
      toast.success("Course created successfully!");
      router.push(`/teacher/courses/${res.course_id}/lessons/create`);
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
          onClick={() => router.push("/teacher/courses")}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Create New Course
          </h1>
          <p className="text-sm text-zinc-500">
            Fill in the details for your new course
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <CourseForm
          onSubmit={handleCreate}
          submitLabel="Create Course"
        />
      </div>
    </div>
  );
}