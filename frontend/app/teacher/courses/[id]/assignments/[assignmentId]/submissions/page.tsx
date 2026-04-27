"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Star } from "lucide-react";
import { assignmentService } from "@/services/assignment.service";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage, formatDateTime } from "@/lib/utils";
import { Submission } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/TextArea";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

export default function SubmissionsPage() {
  useRoleGuard(["teacher", "admin"]);
  const { id, assignmentId } = useParams();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeModal, setGradeModal] = useState<Submission | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);


  const load = async () => {
    try {
      const data = await assignmentService.getSubmissions(
        Number(assignmentId)
      );
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
    try {
      const data = await assignmentService.getSubmissions(
        Number(assignmentId)
      );
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  };
    load();
  }, [assignmentId]);

  const openGradeModal = (sub: Submission) => {
    setGradeModal(sub);
    setGrade(sub.grade !== null ? String(sub.grade) : "");
    setFeedback(sub.feedback || "");
  };

  const handleGrade = async () => {
    if (!gradeModal) return;
    const gradeNum = Number(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast.error("Grade must be between 0 and 100");
      return;
    }
    setGrading(true);
    try {
      await assignmentService.gradeSubmission(gradeModal.id, {
        grade: gradeNum,
        feedback,
      });
      toast.success("Submission graded!");
      setGradeModal(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGrading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/courses/${id}`)}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Submissions
          </h1>
          <p className="text-sm text-zinc-500">
            {submissions.length} submission
            {submissions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          No submissions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5">
                <p className="font-medium text-zinc-100">
                  {sub.student_name}
                </p>
                <p className="text-xs text-zinc-500">
                  Submitted {formatDateTime(sub.submitted_at)}
                </p>
                {sub.file_url && (
                  <a
                    href={sub.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View submission file
                  </a>
                )}
                {sub.grade !== null && (
                  <div className="flex items-center gap-2 pt-1">
                    <Star
                      size={13}
                      className="text-yellow-400 fill-yellow-400"
                    />
                    <span className="text-sm text-zinc-300">
                      {sub.grade}/100
                    </span>
                    {sub.feedback && (
                      <span className="text-xs text-zinc-500">
                        — {sub.feedback}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant={sub.grade !== null ? "secondary" : "primary"}
                onClick={() => openGradeModal(sub)}
              >
                <Star size={13} />
                {sub.grade !== null ? "Re-grade" : "Grade"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* grade modal */}
      <Modal
        isOpen={!!gradeModal}
        onClose={() => setGradeModal(null)}
        title={`Grade — ${gradeModal?.student_name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Grade (0–100)"
            type="number"
            min={0}
            max={100}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="e.g. 85"
          />
          <Textarea
            label="Feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Great work! However..."
            rows={3}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setGradeModal(null)}
            >
              Cancel
            </Button>
            <Button loading={grading} onClick={handleGrade}>
              Save Grade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}