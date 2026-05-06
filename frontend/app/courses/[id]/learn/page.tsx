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
  MessageSquare,
  Send,
  Bot,
  User,
  X,
  ChevronDown,
  BookOpen,
  Layers,
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
import { API_URL } from "@/lib/api";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const VIDEO_COMPLETION_RATIO = 0.75;
const WATCH_PING_INTERVAL_SECONDS = 5;

// ─── Chat types ───────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ---Markdown support for chatpanel---

const MessageContent = ({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) => {
  if (role === "user") {
    return <>{content}</>;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        // Optional: customise elements
        pre: ({ children }) => (
          <pre className="bg-black/20 rounded-lg p-3 my-2 overflow-x-auto">
            {children}
          </pre>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          return isInline ? (
            <code
              className="bg-white/10 px-1 py-0.5 rounded text-sm"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// ─── ChatPanel ────────────────────────────────────────────────────────────────
function ChatPanel({
  lessonId,
  userId,
}: {
  lessonId: number | null;
  userId: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    const createSession = async () => {
      const res = await fetch(`${API_URL}/sessions/${userId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, lesson_id: lessonId }),
      });
      const { id } = await res.json();
      setSessionId(id);
    };
    createSession();
  }, [lessonId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    console.log("user id", userId);
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const payload = {
        user_id: userId,
        model: "openrouter/free",
        content: userMsg.content,
        lesson_id: lessonId,
      };
      console.log(payload);

      const res = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.text();
      console.log(data);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data ?? "No response received.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error("Failed to get a response. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Bot size={22} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">
                AI Lesson Assistant
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-48">
                Ask anything about this lesson. I'm here to help.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              {[
                "Summarize this lesson",
                "Quiz me on this topic",
                "Explain a concept simply",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs text-zinc-400 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/5 hover:text-zinc-200 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === "user"
                  ? "bg-violet-500/20 border border-violet-500/30"
                  : "bg-zinc-700/60 border border-white/10"
              }`}
            >
              {msg.role === "user" ? (
                <User size={13} className="text-violet-300" />
              ) : (
                <Bot size={13} className="text-zinc-300" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-500/15 border border-violet-500/20 text-zinc-200 rounded-tr-sm"
                  : "bg-white/5 border border-white/8 text-zinc-300 rounded-tl-sm"
              }`}
            >
              <MessageContent role={msg.role} content={msg.content} />
              {/* {msg.content} */}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-zinc-700/60 border border-white/10">
              <Bot size={13} className="text-zinc-300" />
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/8">
        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-violet-500/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this lesson…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 resize-none outline-none max-h-24 scrollbar-thin py-0.5"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);

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
  const [chatOpen, setChatOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"lessons" | "assignments">(
    "lessons",
  );

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
        ? (progress?.lessons.find((l) => l.lesson_id === currentLesson.id) ??
          null)
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
      toast("Skipping does not count as watch time.", { icon: "⏱️" });
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
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [flushWatchProgress, startWatchTimer, stopWatchTimer]);

  const watchRequiredSeconds =
    currentLessonProgress?.required_watch_seconds ?? 0;
  const watchedSeconds = currentLessonProgress?.watched_seconds ?? 0;
  const watchPercentage =
    watchRequiredSeconds > 0
      ? Math.min((watchedSeconds / watchRequiredSeconds) * 100, 100)
      : (currentLessonProgress?.watch_percentage ?? 0);
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
    if (watchRequiredSeconds <= 0) return "Please start the video first.";
    return `Watch ${formatDuration(remainingWatchSeconds)} more before marking complete.`;
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

  const completedCount = progress?.completed_lessons ?? 0;
  const totalCount = progress?.total_lessons ?? lessons.length;
  const overallProgress = progress?.overall_progress ?? 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-white/8 bg-zinc-950/50 overflow-hidden">
        {/* Progress header */}
        <div className="px-4 py-4 border-b border-white/8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
              Progress
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            {Math.round(overallProgress)}% complete
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/8">
          <button
            onClick={() => setSidebarTab("lessons")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${
              sidebarTab === "lessons"
                ? "text-violet-400 border-b-2 border-violet-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <BookOpen size={12} />
            Lessons
          </button>
          {assignments.length > 0 && (
            <button
              onClick={() => setSidebarTab("assignments")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${
                sidebarTab === "assignments"
                  ? "text-orange-400 border-b-2 border-orange-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ClipboardList size={12} />
              Tasks
              {assignments.length > 0 && (
                <span className="bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {assignments.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Lesson / Assignment list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {sidebarTab === "lessons" &&
            lessons.map((lesson, idx) => {
              const done = isCompleted(lesson.id);
              const active =
                currentLesson?.id === lesson.id && view === "lesson";
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-white/5 transition-all group cursor-pointer ${
                    active ? "bg-violet-500/10" : "hover:bg-white/4"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {done ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : (
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 ${
                          active
                            ? "border-violet-400"
                            : "border-zinc-600 group-hover:border-zinc-400"
                        }`}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-mono mb-0.5 ${active ? "text-violet-400" : "text-zinc-600"}`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </p>
                    <p
                      className={`text-sm leading-snug line-clamp-2 ${
                        active
                          ? "text-zinc-100"
                          : done
                            ? "text-zinc-400"
                            : "text-zinc-300"
                      }`}
                    >
                      {lesson.title}
                    </p>
                  </div>
                </button>
              );
            })}

          {sidebarTab === "assignments" &&
            assignments.map((a) => {
              const active =
                activeAssignment?.id === a.id && view === "assignment";
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    void flushWatchProgress();
                    stopWatchTimer();
                    setActiveAssignment(a);
                    setView("assignment");
                    loadMySubmission(a.id);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-white/5 transition-all cursor-pointer ${
                    active ? "bg-orange-500/10" : "hover:bg-white/4"
                  }`}
                >
                  <ClipboardList
                    size={14}
                    className="text-orange-400 shrink-0 mt-0.5"
                  />
                  <span
                    className={`text-sm line-clamp-2 ${active ? "text-zinc-100" : "text-zinc-300"}`}
                  >
                    {a.title}
                  </span>
                </button>
              );
            })}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Content area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 space-y-5">
            {view === "lesson" && currentLesson && (
              <>
                {/* Top bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                    <span>Lesson</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-zinc-300">
                      {currentIndex + 1} of {lessons.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
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
                          <CheckCircle size={13} />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle size={13} />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Lesson title */}
                <div>
                  <h1 className="text-2xl font-bold text-zinc-100 leading-tight">
                    {currentLesson.title}
                  </h1>
                  {currentLesson.description && (
                    <p className="text-zinc-500 mt-1.5 text-sm leading-relaxed">
                      {currentLesson.description}
                    </p>
                  )}
                  {markCompleteLocked && (
                    <p className="text-xs text-amber-300/80 mt-2">
                      ⏱{" "}
                      {watchRequiredSeconds > 0
                        ? `${formatDuration(remainingWatchSeconds)} watch time remaining`
                        : "Start video to unlock"}
                    </p>
                  )}
                </div>

                {/* Video */}
                {currentLesson.video_url && (
                  <div className="space-y-3">
                    <div className="rounded-2xl overflow-hidden bg-black border border-white/8">
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
                        className="w-full max-h-[460px]"
                      />
                    </div>

                    {!currentLessonCompleted && (
                      <div className="rounded-xl border border-amber-400/15 bg-amber-500/8 p-3">
                        <div className="flex items-center justify-between text-xs text-amber-200/80 mb-2">
                          <span>
                            Watch progress · {Math.round(watchPercentage)}%
                          </span>
                          <span className="font-mono">
                            {formatDuration(watchedSeconds)} /{" "}
                            {watchRequiredSeconds > 0
                              ? formatDuration(watchRequiredSeconds)
                              : "detecting…"}
                          </span>
                        </div>
                        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-300"
                            style={{
                              width: `${Math.min(watchPercentage, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-amber-100/50 leading-relaxed">
                          Watch at least 75% before marking complete. Skipping
                          forward won't count.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* External video */}
                {!currentLesson.video_url &&
                  currentLesson.external_video_link && (
                    <div className="space-y-3">
                      <div className="aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/8">
                        <iframe
                          src={currentLesson.external_video_link.replace(
                            "watch?v=",
                            "embed/",
                          )}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                      <p className="rounded-xl border border-blue-400/15 bg-blue-500/8 px-3 py-2 text-xs text-blue-200/70">
                        External videos can't expose exact watch time. Anti-skip
                        tracking only applies to uploaded videos.
                      </p>
                    </div>
                  )}

                {/* Resources */}
                {(currentLesson.pdf_url ||
                  (currentLesson.external_video_link &&
                    currentLesson.video_url)) && (
                  <div className="flex flex-wrap gap-2">
                    {currentLesson.pdf_url && (
                      <a
                        href={currentLesson.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 hover:bg-blue-500/18 transition-colors"
                      >
                        <FileText size={13} />
                        Download PDF
                      </a>
                    )}
                    {currentLesson.external_video_link &&
                      currentLesson.video_url && (
                        <a
                          href={currentLesson.external_video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-400 hover:bg-orange-500/18 transition-colors"
                        >
                          <ExternalLink size={13} />
                          External Resource
                        </a>
                      )}
                  </div>
                )}

                {/* Prev / Next */}
                <div className="flex justify-between gap-3 pt-2 border-t border-white/8">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentIndex === 0}
                    onClick={() =>
                      handleSelectLesson(lessons[currentIndex - 1])
                    }
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentIndex === lessons.length - 1}
                    onClick={() =>
                      handleSelectLesson(lessons[currentIndex + 1])
                    }
                  >
                    Next
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </>
            )}

            {view === "assignment" && activeAssignment && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList size={16} className="text-orange-400" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                      Assignment
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-100">
                    {activeAssignment.title}
                  </h2>
                  {activeAssignment.description && (
                    <p className="text-zinc-400 leading-relaxed mt-2 text-sm">
                      {activeAssignment.description}
                    </p>
                  )}
                  {activeAssignment.due_date && (
                    <p className="text-xs text-orange-400 mt-2 font-mono">
                      Due: {formatDateTime(activeAssignment.due_date)}
                    </p>
                  )}
                </div>

                {mySubmission ? (
                  <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      <p className="text-sm font-medium text-green-400">
                        Submitted
                      </p>
                    </div>
                    {mySubmission.file_url && (
                      <a
                        href={mySubmission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 underline block"
                      >
                        View my submission
                      </a>
                    )}
                    {mySubmission.grade !== null ? (
                      <div className="pt-3 border-t border-green-500/20 space-y-1">
                        <p className="text-sm text-zinc-300">
                          Grade:{" "}
                          <span className="font-bold text-violet-400 ml-1">
                            {mySubmission.grade}/100
                          </span>
                        </p>
                        {mySubmission.feedback && (
                          <p className="text-sm text-zinc-400">
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
                      Submit your work. You can optionally attach a file.
                    </p>
                    <label className="cursor-pointer block">
                      <div
                        className={`w-full h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${
                          submitFile
                            ? "border-violet-500/50 bg-violet-500/5"
                            : "border-white/10 hover:border-violet-500/30 bg-white/3"
                        }`}
                      >
                        <Upload
                          size={20}
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
                        onChange={(e) =>
                          setSubmitFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    <Button
                      onClick={handleSubmitAssignment}
                      loading={submitting}
                    >
                      <Upload size={14} />
                      Submit Assignment
                    </Button>
                  </div>
                )}
              </div>
            )}

            {lessons.length === 0 && view === "lesson" && (
              <div className="text-center py-24 text-zinc-600">
                <Layers size={32} className="mx-auto mb-3 opacity-30" />
                No lessons available yet.
              </div>
            )}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div
          className={`flex flex-col border-l border-white/8 bg-zinc-950/60 transition-all duration-300 ${
            chatOpen ? "w-80 xl:w-96" : "w-12"
          } shrink-0`}
        >
          {/* Chat toggle header */}
          <div
            className="flex items-center gap-2 px-3 py-3.5 border-b border-white/8 cursor-pointer hover:bg-white/4 transition-colors select-none"
            onClick={() => setChatOpen((o) => !o)}
          >
            <div className="w-7 h-7 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
              <MessageSquare size={13} className="text-violet-400" />
            </div>
            {chatOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 leading-none">
                    AI Assistant
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    Ask about this lesson
                  </p>
                </div>
                <ChevronRight size={13} className="text-zinc-600 rotate-180" />
              </>
            )}
            {!chatOpen && (
              <ChevronLeft
                size={13}
                className="text-zinc-600 rotate-180 absolute"
              />
            )}
          </div>

          {chatOpen && (
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                lessonId={
                  view === "lesson" ? (currentLesson?.id ?? null) : null
                }
                userId={user?.id ?? 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
