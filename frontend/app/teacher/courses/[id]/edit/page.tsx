"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { courseService } from "@/services/course.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage } from "@/lib/utils";
import { Course } from "@/types";
import CourseForm from "@/components/forms/CourseForm";
import Button from "@/components/ui/Button";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function EditCoursePage() {
  useRoleGuard(["teacher", "admin"]);
  const { id } = useParams();
  const router = useRouter();
  const courseId = Number(id);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService
      .getById(courseId)
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleUpdate = async (data: {
    title: string;
    description: string;
    thumbnail: File | null;
  }) => {
    try {
      await courseService.update(courseId, data);
      toast.success("Course updated!");
      router.push("/teacher/courses");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!course) return null;

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
          <h1 className="text-2xl font-bold text-zinc-100">Edit Course</h1>
          <p className="text-sm text-zinc-500">{course.title}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <CourseForm
          initial={course}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}