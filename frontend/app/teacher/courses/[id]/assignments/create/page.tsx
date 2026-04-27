"use client";

import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { assignmentService } from "@/services/assignment.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage } from "@/lib/utils";
import AssignmentForm from "@/components/forms/AssignmentForm";
import Button from "@/components/ui/Button";

export default function CreateAssignmentPage() {
  useRoleGuard(["teacher", "admin"]);
  const { id } = useParams();
  const router = useRouter();
  const courseId = Number(id);

  const handleCreate = async (data: {
    title: string;
    description: string;
    due_date: string;
  }) => {
    try {
      await assignmentService.create(courseId, data);
      toast.success("Assignment created!");
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
          <h1 className="text-2xl font-bold text-zinc-100">
            Create Assignment
          </h1>
          <p className="text-sm text-zinc-500">
            Add a new assignment to this course
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <AssignmentForm
          onSubmit={handleCreate}
          submitLabel="Create Assignment"
        />
      </div>
    </div>
  );
}