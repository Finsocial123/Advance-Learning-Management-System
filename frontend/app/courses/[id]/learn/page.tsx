"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Circle,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Upload,
  ClipboardList,
} from "lucide-react";

import { lessonService } from "@/services/lesson.service";
import { progressService } from "@/services/progress.service";
import { assignmentService } from "@/services/assignment.service";
import { useAuthStore } from "@/store/authStore";

import {
  Lesson,
  CourseProgress,
  Assignment,
  Submission,
} from "@/types";

import {
  getErrorMessage,
  formatDateTime,
} from "@/lib/utils";

import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function LearnPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { isAuthenticated } = useAuthStore();

  const courseId = Number(params.id);
  const initialLessonId = searchParams.get("lesson");
  const initialAssignmentId = searchParams.get("assignment");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeAssignment, setActiveAssignment] =
    useState<Assignment | null>(null);

  const [mySubmission, setMySubmission] =
    useState<Submission | null>(null);

  const [submitFile, setSubmitFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [view, setView] =
    useState<"lesson" | "assignment">("lesson");

  const loadMySubmission = async (assignmentId: number) => {
    try {
      const sub =
        await assignmentService.getMySubmission(
          assignmentId
        );
      setMySubmission(sub);
    } catch {
      setMySubmission(null);
    }
  };

 
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

     const load = async () => {
    try {
      const [l, p, a] = await Promise.all([
        lessonService.getByCourse(courseId),
        progressService.getCourseProgress(courseId),
        assignmentService.getByCourse(courseId) as any,
      ]);

      setLessons(l);
      setProgress(p);
      setAssignments(a);

      if (initialAssignmentId) {
        const found = a.find(
          (x: Assignment) =>
            x.id === Number(initialAssignmentId)
        );

        if (found) {
          setActiveAssignment(found);
          setView("assignment");
          loadMySubmission(found.id);
        }
      } else {
        const target = initialLessonId
          ? l.find(
              (x: Lesson) =>
                x.id === Number(initialLessonId)
            )
          : l[0];

        if (target) {
          setCurrentLesson(target);
        }
      }
    } catch {
      toast.error(
        "Could not load course. Are you enrolled?"
      );
      router.push(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };


    load();
  }, [courseId, isAuthenticated, router, initialAssignmentId, initialLessonId]);

  const isCompleted = (lessonId: number) =>
    progress?.lessons.find(
      (l) => l.lesson_id === lessonId
    )?.completed ?? false;

  const handleMarkComplete = async () => {
    if (!currentLesson) return;

    setMarkingDone(true);

    try {
      if (isCompleted(currentLesson.id)) {
        await progressService.markIncomplete(
          currentLesson.id
        );
        toast.success("Marked as incomplete");
      } else {
        await progressService.markComplete(
          currentLesson.id
        );
        toast.success("Lesson completed!");
      }

      const updated =
        await progressService.getCourseProgress(
          courseId
        );

      setProgress(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingDone(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!activeAssignment) return;

    setSubmitting(true);

    try {
      await assignmentService.submit(
        activeAssignment.id,
        submitFile || undefined
      );

      toast.success("Assignment submitted!");

      loadMySubmission(activeAssignment.id);
      setSubmitFile(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentIndex = lessons.findIndex(
    (l) => l.id === currentLesson?.id
  );

  if (loading) return <FullPageSpinner />;

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-3">
        {progress && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
              Course Progress
            </p>

            <ProgressBar
              value={progress.overall_progress}
              size="sm"
            />

            <p className="text-xs text-zinc-600 mt-1">
              {progress.completed_lessons}/
              {progress.total_lessons} lessons
            </p>
          </div>
        )}

        {/* Lessons */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <p className="text-xs text-zinc-500 px-4 py-3 border-b border-zinc-800 uppercase tracking-wider">
            Lessons
          </p>

          <div className="max-h-96 overflow-y-auto">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setCurrentLesson(lesson);
                  setView("lesson");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0 cursor-pointer ${
                  currentLesson?.id === lesson.id &&
                  view === "lesson"
                    ? "bg-violet-500/10"
                    : ""
                }`}
              >
                {isCompleted(lesson.id) ? (
                  <CheckCircle
                    size={15}
                    className="text-green-400 shrink-0"
                  />
                ) : (
                  <Circle
                    size={15}
                    className="text-zinc-600 shrink-0"
                  />
                )}

                <span className="text-sm text-zinc-300 line-clamp-2">
                  {lesson.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Assignments */}
        {assignments.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <p className="text-xs text-zinc-500 px-4 py-3 border-b border-zinc-800 uppercase tracking-wider">
              Assignments
            </p>

            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setActiveAssignment(a);
                  setView("assignment");
                  loadMySubmission(a.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0 cursor-pointer ${
                  activeAssignment?.id === a.id &&
                  view === "assignment"
                    ? "bg-orange-500/10"
                    : ""
                }`}
              >
                <ClipboardList
                  size={15}
                  className="text-orange-400 shrink-0"
                />

                <span className="text-sm text-zinc-300 line-clamp-2">
                  {a.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-5">
        {view === "lesson" && currentLesson && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-600 font-mono mb-1">
                    Lesson {currentIndex + 1} of{" "}
                    {lessons.length}
                  </p>

                  <h1 className="text-xl font-bold text-zinc-100">
                    {currentLesson.title}
                  </h1>

                  {currentLesson.description && (
                    <p className="text-sm text-zinc-500 mt-2">
                      {currentLesson.description}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant={
                    isCompleted(currentLesson.id)
                      ? "secondary"
                      : "primary"
                  }
                  onClick={handleMarkComplete}
                  loading={markingDone}
                >
                  {isCompleted(currentLesson.id) ? (
                    <>
                      <CheckCircle size={14} />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle size={14} />
                      Mark Complete
                    </>
                  )}
                </Button>
              </div>

              {/* Uploaded Video */}
              {currentLesson.video_url && (
                <div className="mb-4">
                  <video
                    src={currentLesson.video_url}
                    controls
                    className="w-full rounded-xl max-h-115 bg-black"
                  />
                </div>
              )}

              {/* External Video */}
              {!currentLesson.video_url &&
                currentLesson.external_video_link && (
                  <div className="mb-4">
                    <div className="aspect-video w-full bg-zinc-800 rounded-xl overflow-hidden">
                      <iframe
                        src={currentLesson.external_video_link.replace(
                          "watch?v=",
                          "embed/"
                        )}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

              {/* Resources */}
              <div className="flex flex-wrap gap-3 mt-4">
                {currentLesson.pdf_url && (
                  <a
                    href={currentLesson.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <FileText size={15} />
                    Download PDF
                  </a>
                )}

                {currentLesson.external_video_link &&
                  currentLesson.video_url && (
                    <a
                      href={
                        currentLesson.external_video_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-400 hover:bg-orange-500/20 transition-colors"
                    >
                      <ExternalLink size={15} />
                      External Resource
                    </a>
                  )}
              </div>
            </div>

            {/* Prev Next */}
            <div className="flex justify-between gap-4">
              <Button
                variant="secondary"
                disabled={currentIndex === 0}
                onClick={() =>
                  setCurrentLesson(
                    lessons[currentIndex - 1]
                  )
                }
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <Button
                variant="secondary"
                disabled={
                  currentIndex ===
                  lessons.length - 1
                }
                onClick={() =>
                  setCurrentLesson(
                    lessons[currentIndex + 1]
                  )
                }
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </>
        )}

        {view === "assignment" &&
          activeAssignment && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList
                    size={18}
                    className="text-orange-400"
                  />

                  <h2 className="text-xl font-bold text-zinc-100">
                    {activeAssignment.title}
                  </h2>
                </div>

                {activeAssignment.description && (
                  <p className="text-zinc-400 leading-relaxed mt-2">
                    {activeAssignment.description}
                  </p>
                )}

                {activeAssignment.due_date && (
                  <p className="text-sm text-orange-400 mt-2">
                    Due:{" "}
                    {formatDateTime(
                      activeAssignment.due_date
                    )}
                  </p>
                )}
              </div>

              {mySubmission ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-green-400">
                    ✓ Submitted
                  </p>

                  {mySubmission.file_url && (
                    <a
                      href={mySubmission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 underline"
                    >
                      View my submission
                    </a>
                  )}

                  {mySubmission.grade !== null ? (
                    <div className="pt-2 border-t border-green-500/20">
                      <p className="text-sm text-zinc-300">
                        Grade:
                        <span className="font-bold text-violet-400 ml-1">
                          {mySubmission.grade}/100
                        </span>
                      </p>

                      {mySubmission.feedback && (
                        <p className="text-sm text-zinc-400 mt-1">
                          Feedback:{" "}
                          {mySubmission.feedback}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      Awaiting grade from teacher
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400">
                    Submit your work for this
                    assignment. You can attach a
                    file.
                  </p>

                  <label className="cursor-pointer block">
                    <div
                      className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
                        submitFile
                          ? "border-violet-500/50 bg-violet-500/5"
                          : "border-zinc-700 hover:border-violet-500/30 bg-zinc-800/30"
                      }`}
                    >
                      <Upload
                        size={22}
                        className={
                          submitFile
                            ? "text-violet-400"
                            : "text-zinc-500"
                        }
                      />

                      <span className="text-sm text-zinc-500">
                        {submitFile
                          ? submitFile.name
                          : "Click to attach file (optional)"}
                      </span>
                    </div>

                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setSubmitFile(
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </label>

                  <Button
                    onClick={
                      handleSubmitAssignment
                    }
                    loading={submitting}
                  >
                    <Upload size={15} />
                    Submit Assignment
                  </Button>
                </div>
              )}
            </div>
          )}

        {lessons.length === 0 &&
          view === "lesson" && (
            <div className="text-center py-16 text-zinc-500">
              No lessons available yet.
            </div>
          )}
      </div>
    </div>
  );
}