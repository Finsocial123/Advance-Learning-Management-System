"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  VideoWatchProgress,
} from "@/types";

import { getErrorMessage, formatDateTime } from "@/lib/utils";

import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { FullPageSpinner } from "@/components/ui/Spinner";

const VIDEO_COMPLETION_RATIO = 0.75;
const WATCH_PING_INTERVAL_SECONDS = 5;

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(Math.ceil(totalSeconds), 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function getRequiredWatchSeconds(duration: number) {
  if (!duration || duration <= 0) return 0;
  return Math.round(duration * VIDEO_COMPLETION_RATIO);
}

export default function LearnPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const courseId = Number(params.id);
  const initialLessonId = searchParams.get("lesson");
  const initialAssignmentId = searchParams.get("assignment");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(
    null,
  );

  const [mySubmission, setMySubmission] = useState<Submission | null>(null);

  const [submitFile, setSubmitFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [view, setView] = useState<"lesson" | "assignment">("lesson");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const watchIntervalRef = useRef<number | null>(null);
  const pendingWatchSecondsRef = useRef(0);
  const lastTickAtRef = useRef<number | null>(null);
  const isSeekingRef = useRef(false);
  const sendingWatchRef = useRef(false);
  const lastSkipToastAtRef = useRef(0);

  const currentLessonProgress = useMemo(
    () =>
      currentLesson
        ? progress?.lessons.find((l) => l.lesson_id === currentLesson.id) ??
          null
        : null,
    [currentLesson, progress],
  );

  const currentIndex = lessons.findIndex((l) => l.id === currentLesson?.id);

  const loadMySubmission = async (assignmentId: number) => {
    try {
      const sub = await assignmentService.getMySubmission(assignmentId);
      setMySubmission(sub);
    } catch {
      setMySubmission(null);
    }
  };

  const isCompleted = useCallback(
    (lessonId: number) =>
      progress?.lessons.find((l) => l.lesson_id === lessonId)?.completed ??
      false,
    [progress],
  );

  const applyWatchStatus = useCallback(
    (lessonId: number, watch: Partial<VideoWatchProgress>) => {
      setProgress((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          lessons: prev.lessons.map((lesson) => {
            if (lesson.lesson_id !== lessonId) return lesson;

            const watchedSeconds =
              watch.watched_seconds ?? lesson.watched_seconds ?? 0;
            const durationSeconds =
              watch.video_duration_seconds ??
              lesson.video_duration_seconds ??
              0;
            const requiredSeconds =
              watch.required_watch_seconds ??
              lesson.required_watch_seconds ??
              getRequiredWatchSeconds(durationSeconds);
            const watchPercentage =
              watch.watch_percentage ??
              (requiredSeconds > 0
                ? Math.min((watchedSeconds / requiredSeconds) * 100, 100)
                : 0);

            return {
              ...lesson,
              watched_seconds: watchedSeconds,
              video_duration_seconds: durationSeconds,
              required_watch_seconds: requiredSeconds,
              watch_percentage: Math.round(watchPercentage * 100) / 100,
              can_mark_complete:
                lesson.completed ||
                !lesson.has_trackable_video ||
                Boolean(watch.can_mark_complete) ||
                (requiredSeconds > 0 && watchedSeconds >= requiredSeconds),
            };
          }),
        };
      });
    },
    [],
  );

  const addOptimisticWatchSeconds = useCallback(
    (lessonId: number, seconds: number, duration: number) => {
      if (seconds <= 0) return;

      setProgress((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          lessons: prev.lessons.map((lesson) => {
            if (lesson.lesson_id !== lessonId) return lesson;

            const existingWatched = lesson.watched_seconds ?? 0;
            const durationSeconds =
              duration || lesson.video_duration_seconds || 0;
            const watchedSeconds = durationSeconds
              ? Math.min(existingWatched + seconds, durationSeconds)
              : existingWatched + seconds;
            const requiredSeconds =
              lesson.required_watch_seconds ||
              getRequiredWatchSeconds(durationSeconds);
            const watchPercentage =
              requiredSeconds > 0
                ? Math.min((watchedSeconds / requiredSeconds) * 100, 100)
                : 0;

            return {
              ...lesson,
              watched_seconds: Math.round(watchedSeconds * 100) / 100,
              video_duration_seconds: durationSeconds,
              required_watch_seconds: requiredSeconds,
              watch_percentage: Math.round(watchPercentage * 100) / 100,
              can_mark_complete:
                lesson.completed ||
                (requiredSeconds > 0 && watchedSeconds >= requiredSeconds),
            };
          }),
        };
      });
    },
    [],
  );

  const flushWatchProgress = useCallback(
    async (forceZeroPing = false) => {
      if (!currentLesson?.video_url) return;
      if (sendingWatchRef.current) return;

      const video = videoRef.current;
      const duration =
        video?.duration && Number.isFinite(video.duration) ? video.duration : 0;
      const currentPosition =
        video?.currentTime && Number.isFinite(video.currentTime)
          ? video.currentTime
          : 0;
      const pendingSeconds = pendingWatchSecondsRef.current;

      if (!forceZeroPing && pendingSeconds <= 0) return;

      pendingWatchSecondsRef.current = 0;
      sendingWatchRef.current = true;

      try {
        const status = await progressService.trackVideoWatch(currentLesson.id, {
          watched_seconds_delta: Math.round(pendingSeconds * 100) / 100,
          video_duration_seconds: duration || undefined,
          current_position_seconds: currentPosition || undefined,
        });

        applyWatchStatus(currentLesson.id, status);
      } catch {
        pendingWatchSecondsRef.current += pendingSeconds;
      } finally {
        sendingWatchRef.current = false;
      }
    },
    [applyWatchStatus, currentLesson],
  );

  const stopWatchTimer = useCallback(() => {
    if (watchIntervalRef.current !== null) {
      window.clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
    lastTickAtRef.current = null;
  }, []);

  const tickWatchTimer = useCallback(() => {
    const video = videoRef.current;

    if (
      !currentLesson?.video_url ||
      !video ||
      video.paused ||
      video.ended ||
      isSeekingRef.current ||
      document.visibilityState !== "visible"
    ) {
      lastTickAtRef.current = Date.now();
      return;
    }

    const now = Date.now();
    const lastTickAt = lastTickAtRef.current ?? now;
    const elapsedSeconds = Math.min((now - lastTickAt) / 1000, 1.5);
    lastTickAtRef.current = now;

    if (elapsedSeconds <= 0) return;

    const duration =
      video.duration && Number.isFinite(video.duration) ? video.duration : 0;

    pendingWatchSecondsRef.current += elapsedSeconds;
    addOptimisticWatchSeconds(currentLesson.id, elapsedSeconds, duration);

    if (pendingWatchSecondsRef.current >= WATCH_PING_INTERVAL_SECONDS) {
      void flushWatchProgress();
    }
  }, [addOptimisticWatchSeconds, currentLesson, flushWatchProgress]);

  const startWatchTimer = useCallback(() => {
    if (!currentLesson?.video_url) return;

    lastTickAtRef.current = Date.now();

    if (watchIntervalRef.current === null) {
      watchIntervalRef.current = window.setInterval(tickWatchTimer, 1000);
    }
  }, [currentLesson, tickWatchTimer]);

  const handleSelectLesson = useCallback(
    (lesson: Lesson) => {
      void flushWatchProgress();
      stopWatchTimer();
      pendingWatchSecondsRef.current = 0;
      setCurrentLesson(lesson);
      setView("lesson");
    },
    [flushWatchProgress, stopWatchTimer],
  );

  const handleVideoLoadedMetadata = useCallback(() => {
    if (!currentLesson?.video_url) return;

    const video = videoRef.current;
    const duration =
      video?.duration && Number.isFinite(video.duration) ? video.duration : 0;

    if (duration > 0) {
      applyWatchStatus(currentLesson.id, {
        video_duration_seconds: duration,
        required_watch_seconds: getRequiredWatchSeconds(duration),
      });

      void flushWatchProgress(true);
    }
  }, [applyWatchStatus, currentLesson, flushWatchProgress]);

  const handleVideoSeeking = useCallback(() => {
    isSeekingRef.current = true;
    lastTickAtRef.current = Date.now();

    const now = Date.now();
    if (now - lastSkipToastAtRef.current > 4000) {
      toast("Skipping does not count as watch time.", {
        icon: "⏱️",
      });
      lastSkipToastAtRef.current = now;
    }
  }, []);

  const handleVideoSeeked = useCallback(() => {
    isSeekingRef.current = false;
    lastTickAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        const [l, p, a] = await Promise.all([
          lessonService.getByCourse(courseId),
          progressService.getCourseProgress(courseId),
          assignmentService.getByCourse(courseId),
        ]);

        setLessons(l);
        setProgress(p);
        setAssignments(a);

        if (initialAssignmentId) {
          const found = a.find((x) => x.id === Number(initialAssignmentId));
          if (found) {
            setActiveAssignment(found);
            setView("assignment");
            loadMySubmission(found.id);
          }
        } else {
          const target = initialLessonId
            ? l.find((x) => x.id === Number(initialLessonId))
            : l[0];

          if (target) setCurrentLesson(target);
        }
      } catch {
        toast.error("Could not load course. Are you enrolled?");
        router.push(`/courses/${courseId}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    hasHydrated,
    courseId,
    isAuthenticated,
    router,
    initialAssignmentId,
    initialLessonId,
  ]);

  useEffect(() => {
    pendingWatchSecondsRef.current = 0;
    isSeekingRef.current = false;
    lastTickAtRef.current = null;
    stopWatchTimer();

    return () => {
      void flushWatchProgress();
      stopWatchTimer();
    };
  }, [currentLesson?.id, flushWatchProgress, stopWatchTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        void flushWatchProgress();
        stopWatchTimer();
      } else if (videoRef.current && !videoRef.current.paused) {
        startWatchTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushWatchProgress, startWatchTimer, stopWatchTimer]);

  const watchRequiredSeconds =
    currentLessonProgress?.required_watch_seconds ?? 0;
  const watchedSeconds = currentLessonProgress?.watched_seconds ?? 0;
  const watchPercentage =
    watchRequiredSeconds > 0
      ? Math.min((watchedSeconds / watchRequiredSeconds) * 100, 100)
      : currentLessonProgress?.watch_percentage ?? 0;
  const remainingWatchSeconds = Math.max(
    watchRequiredSeconds - watchedSeconds,
    0,
  );
  const hasTrackableVideo = Boolean(currentLesson?.video_url);
  const currentLessonCompleted = currentLesson
    ? isCompleted(currentLesson.id)
    : false;
  const canMarkCurrentLessonComplete =
    currentLessonCompleted ||
    !hasTrackableVideo ||
    (watchRequiredSeconds > 0 && watchedSeconds >= watchRequiredSeconds);
  const markCompleteLocked =
    Boolean(currentLesson) &&
    hasTrackableVideo &&
    !currentLessonCompleted &&
    !canMarkCurrentLessonComplete;

  const getLockedCompleteMessage = () => {
    if (!currentLesson?.video_url) return "";

    if (watchRequiredSeconds <= 0) {
      return "Please start the video first. You can mark complete after enough watch time is recorded.";
    }

    return `You are required to watch at least ${formatDuration(
      watchRequiredSeconds,
    )} of this video. Watch ${formatDuration(
      remainingWatchSeconds,
    )} more before marking it complete.`;
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;

    if (!isCompleted(currentLesson.id)) {
      await flushWatchProgress();

      if (markCompleteLocked) {
        toast.error(getLockedCompleteMessage());
        return;
      }
    }

    setMarkingDone(true);

    try {
      if (isCompleted(currentLesson.id)) {
        await progressService.markIncomplete(currentLesson.id);
        toast.success("Marked as incomplete");
      } else {
        await progressService.markComplete(currentLesson.id);
        toast.success("Lesson completed!");
      }

      const updated = await progressService.getCourseProgress(courseId);

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
        submitFile || undefined,
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

  if (loading) return <FullPageSpinner />;

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-3">
        {progress && (
          <div className="surface-card rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
              Course Progress
            </p>

            <ProgressBar value={progress.overall_progress} size="sm" />

            <p className="text-xs text-zinc-600 mt-1">
              {progress.completed_lessons}/{progress.total_lessons} lessons
            </p>
          </div>
        )}

        {/* Lessons */}
        <div className="surface-card rounded-2xl overflow-hidden">
          <p className="text-xs text-zinc-500 px-4 py-3 border-b border-white/10 uppercase tracking-wider">
            Lessons
          </p>

          <div className="max-h-96 overflow-y-auto">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/10/50 last:border-0 cursor-pointer ${
                  currentLesson?.id === lesson.id && view === "lesson"
                    ? "bg-violet-500/10"
                    : ""
                }`}
              >
                {isCompleted(lesson.id) ? (
                  <CheckCircle size={15} className="text-green-400 shrink-0" />
                ) : (
                  <Circle size={15} className="text-zinc-600 shrink-0" />
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
          <div className="surface-card rounded-2xl overflow-hidden">
            <p className="text-xs text-zinc-500 px-4 py-3 border-b border-white/10 uppercase tracking-wider">
              Assignments
            </p>

            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  void flushWatchProgress();
                  stopWatchTimer();
                  setActiveAssignment(a);
                  setView("assignment");
                  loadMySubmission(a.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/10/50 last:border-0 cursor-pointer ${
                  activeAssignment?.id === a.id && view === "assignment"
                    ? "bg-orange-500/10"
                    : ""
                }`}
              >
                <ClipboardList size={15} className="text-orange-400 shrink-0" />

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
            <div className="surface-card rounded-4xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-600 font-mono mb-1">
                    Lesson {currentIndex + 1} of {lessons.length}
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

                <div className="flex flex-col items-end gap-2">
                  <Button
                    size="sm"
                    variant={
                      isCompleted(currentLesson.id) ? "secondary" : "primary"
                    }
                    onClick={handleMarkComplete}
                    loading={markingDone}
                    aria-disabled={markCompleteLocked}
                    className={markCompleteLocked ? "opacity-55" : undefined}
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

                  {markCompleteLocked && (
                    <p className="max-w-48 text-right text-[11px] leading-4 text-amber-300/90">
                      {watchRequiredSeconds > 0
                        ? `${formatDuration(remainingWatchSeconds)} more required`
                        : "Start video to unlock"}
                    </p>
                  )}
                </div>
              </div>

              {/* Uploaded Video */}
              {currentLesson.video_url && (
                <div className="mb-4 space-y-3">
                  <video
                    ref={videoRef}
                    src={currentLesson.video_url}
                    controls
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onPlay={startWatchTimer}
                    onPause={() => {
                      void flushWatchProgress();
                      stopWatchTimer();
                    }}
                    onEnded={() => {
                      void flushWatchProgress();
                      stopWatchTimer();
                    }}
                    onSeeking={handleVideoSeeking}
                    onSeeked={handleVideoSeeked}
                    className="w-full rounded-xl max-h-115 bg-black"
                  />

                  {!currentLessonCompleted && (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-amber-100">
                        <span>
                          Video watch requirement: {Math.round(watchPercentage)}%
                        </span>
                        <span>
                          {formatDuration(watchedSeconds)} /{" "}
                          {watchRequiredSeconds > 0
                            ? formatDuration(watchRequiredSeconds)
                            : "detecting..."}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
                        <div
                          className="h-full rounded-full bg-amber-300 transition-all"
                          style={{ width: `${Math.min(watchPercentage, 100)}%` }}
                        />
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-amber-100/70">
                        You need to watch at least 75% of the uploaded video before
                        marking this lesson complete. Skipping forward will not count
                        as watch time.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* External Video */}
              {!currentLesson.video_url &&
                currentLesson.external_video_link && (
                  <div className="mb-4 space-y-3">
                    <div className="aspect-video w-full bg-zinc-800 rounded-xl overflow-hidden">
                      <iframe
                        src={currentLesson.external_video_link.replace(
                          "watch?v=",
                          "embed/",
                        )}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>

                    <p className="rounded-xl border border-blue-400/15 bg-blue-500/10 px-3 py-2 text-xs text-blue-200/80">
                      External video embeds cannot always expose exact watch time to
                      the browser. Exact anti-skip tracking is enforced for uploaded
                      video lessons.
                    </p>
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
                      href={currentLesson.external_video_link}
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
                onClick={() => handleSelectLesson(lessons[currentIndex - 1])}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <Button
                variant="secondary"
                disabled={currentIndex === lessons.length - 1}
                onClick={() => handleSelectLesson(lessons[currentIndex + 1])}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </>
        )}

        {view === "assignment" && activeAssignment && (
          <div className="surface-card rounded-4xl p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={18} className="text-orange-400" />

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
                  Due: {formatDateTime(activeAssignment.due_date)}
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
                        Feedback: {mySubmission.feedback}
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
                  Submit your work for this assignment. You can attach a file.
                </p>

                <label className="cursor-pointer block">
                  <div
                    className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
                      submitFile
                        ? "border-violet-500/50 bg-violet-500/5"
                        : "border-white/10 hover:border-violet-500/30 bg-white/5"
                    }`}
                  >
                    <Upload
                      size={22}
                      className={
                        submitFile ? "text-violet-400" : "text-zinc-500"
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
                    onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                  />
                </label>

                <Button onClick={handleSubmitAssignment} loading={submitting}>
                  <Upload size={15} />
                  Submit Assignment
                </Button>
              </div>
            )}
          </div>
        )}

        {lessons.length === 0 && view === "lesson" && (
          <div className="text-center py-16 text-zinc-500">
            No lessons available yet.
          </div>
        )}
      </div>
    </div>
  );
}
