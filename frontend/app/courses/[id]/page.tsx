"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BookOpen,
  User,
  Calendar,
  PlayCircle,
  FileText,
  ClipboardList,
  Lock,
} from "lucide-react";
import { courseService } from "@/services/course.service";
import { lessonService } from "@/services/lesson.service";
import { assignmentService } from "@/services/assignment.service";
import { enrollmentService } from "@/services/enrollment.service";
import { useAuthStore } from "@/store/authStore";
import { Course, Lesson, Assignment } from "@/types";
import { formatDate, formatDateTime, getErrorMessage } from "@/lib/utils";
import Button from "@/components/ui/Button";
import LessonCard from "@/components/cards/LessonCard";
import { FullPageSpinner } from "@/components/ui/Spinner";
import Image from "next/image";

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const courseId = Number(id);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, l, a] = await Promise.all([
          courseService.getById(courseId),
          lessonService.getByCourse(courseId),
          assignmentService.getByCourse(courseId),
        ]);
        setCourse(c);
        setLessons(l);
        setAssignments(a);

        if (isAuthenticated && user?.role === "student") {
          const check = await enrollmentService.checkEnrollment(courseId);
          setEnrolled(check.enrolled);
        }
      } catch {
        toast.error("Failed to load course");
        router.push("/courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, isAuthenticated, user, router]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setEnrollLoading(true);
    try {
      await enrollmentService.enroll(courseId);
      setEnrolled(true);
      toast.success("Successfully enrolled!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUnenroll = async () => {
    setEnrollLoading(true);
    try {
      await enrollmentService.unenroll(courseId);
      setEnrolled(false);
      toast.success("Unenrolled from course");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!course) return null;

  const isOwner =
    user?.role === "admin" || user?.id === course.teacher_id;
  const isTeacherOrAdmin =
    user?.role === "admin" || user?.role === "teacher";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {course.thumbnail_url && (
          <div className="h-56 overflow-hidden">
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-3">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-zinc-400 leading-relaxed mb-5">
              {course.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-5 mb-6">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <User size={15} />
              <span>{course.teacher_name || "Unknown Teacher"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Calendar size={15} />
              <span>{formatDate(course.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <PlayCircle size={15} />
              <span>{lessons.length} lessons</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <ClipboardList size={15} />
              <span>{assignments.length} assignments</span>
            </div>
          </div>

          {/* action buttons */}
          <div className="flex flex-wrap gap-3">
            {user?.role === "student" && (
              <>
                {enrolled ? (
                  <>
                    <Button
                      onClick={() =>
                        router.push(`/courses/${courseId}/learn`)
                      }
                    >
                      <PlayCircle size={16} />
                      Continue Learning
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleUnenroll}
                      loading={enrollLoading}
                    >
                      Unenroll
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEnroll} loading={enrollLoading}>
                    Enroll Now
                  </Button>
                )}
              </>
            )}

            {isOwner && (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/teacher/courses/${courseId}/edit`)
                  }
                >
                  Edit Course
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(
                      `/teacher/courses/${courseId}/lessons/create`
                    )
                  }
                >
                  Add Lesson
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(
                      `/teacher/courses/${courseId}/assignments/create`
                    )
                  }
                >
                  Add Assignment
                </Button>
              </>
            )}

            {!isAuthenticated && (
              <Button onClick={() => router.push("/login")}>
                Sign in to Enroll
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* lessons */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <PlayCircle size={18} className="text-violet-400" />
          Lessons
        </h2>

        {lessons.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No lessons yet.
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onClick={
                  enrolled || isOwner
                    ? () =>
                        router.push(
                          `/courses/${courseId}/learn?lesson=${lesson.id}`
                        )
                    : undefined
                }
                actionSlot={
                  isOwner ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          router.push(
                            `/teacher/courses/${courseId}/lessons/${lesson.id}/edit`
                          )
                        }
                      >
                        Edit
                      </Button>
                    </div>
                  ) : !enrolled ? (
                    <Lock size={15} className="text-zinc-600" />
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* assignments */}
      {assignments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-orange-400" />
            Assignments
          </h2>
          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <h4 className="font-medium text-zinc-100">{a.title}</h4>
                  {a.description && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {a.description}
                    </p>
                  )}
                  {a.due_date && (
                    <p className="text-xs text-orange-400 mt-2">
                      Due: {formatDateTime(a.due_date)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {user?.role === "student" && enrolled && (
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/courses/${courseId}/learn?assignment=${a.id}`
                        )
                      }
                    >
                      Submit
                    </Button>
                  )}
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        router.push(
                          `/teacher/courses/${courseId}/assignments/${a.id}/submissions`
                        )
                      }
                    >
                      Submissions
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}