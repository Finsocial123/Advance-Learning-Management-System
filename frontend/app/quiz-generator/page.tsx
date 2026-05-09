"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  Lock,
  Sparkles,
  XCircle,
} from "lucide-react";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Spinner, { FullPageSpinner } from "@/components/ui/Spinner";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { quizService, QUIZ_DIFFICULTIES } from "@/services/quiz.service";
import { enrollmentService } from "@/services/enrollment.service";
import { lessonService } from "@/services/lesson.service";
import { useAuthStore } from "@/store/authStore";
import type {
  QuizCourse,
  QuizDifficulty,
  QuizOptionKey,
  QuizQuestion,
  QuizResponse,
} from "@/types";

const optionKeys: QuizOptionKey[] = ["A", "B", "C", "D"];

export default function QuizGeneratorPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [courses, setCourses] = useState<QuizCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, QuizOptionKey>>({});
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "student") {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, router, user]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || user?.role !== "student") return;

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);

        const enrollments = await enrollmentService.getMyEnrollments();
        const mappedCourses = await Promise.all(
          enrollments.map(async (enrollment) => {
            const lessons = await lessonService.getByCourse(enrollment.course_id);

            return {
              course_id: enrollment.course_id,
              course_title: enrollment.course_title ?? `Course #${enrollment.course_id}`,
              teacher_name: enrollment.teacher_name,
              progress: enrollment.progress,
              enrolled_at: enrollment.enrolled_at,
              lessons: lessons
                .sort((a, b) => a.order - b.order)
                .map((lesson) => ({
                  lesson_id: lesson.id,
                  title: lesson.title,
                  description: lesson.description,
                  order: lesson.order,
                  // Existing backend can generate only when lesson chunks exist.
                  // PDF/video lessons are most likely to have chunks; backend still validates this.
                  has_quiz_content: Boolean(lesson.pdf_url || lesson.video_url),
                })),
            };
          }),
        );

        setCourses(mappedCourses);

        const firstCourse = mappedCourses.find((course) => course.lessons.length > 0) ?? mappedCourses[0];
        const firstReadyLesson = firstCourse?.lessons.find((lesson) => lesson.has_quiz_content);
        const firstLesson = firstReadyLesson ?? firstCourse?.lessons[0];

        setSelectedCourseId(firstCourse?.course_id ?? null);
        setSelectedLessonId(firstLesson?.lesson_id ?? null);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [hasHydrated, isAuthenticated, user?.role]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.course_id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const selectedLesson = useMemo(
    () =>
      selectedCourse?.lessons.find((lesson) => lesson.lesson_id === selectedLessonId) ??
      null,
    [selectedCourse, selectedLessonId],
  );

  const answeredCount = useMemo(
    () => quiz?.questions.filter((question) => answers[question.question_number]).length ?? 0,
    [answers, quiz],
  );

  const score = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.reduce((total, question) => {
      return total + (answers[question.question_number] === question.correct_answer ? 1 : 0);
    }, 0);
  }, [answers, quiz]);

  const handleCourseSelect = (course: QuizCourse) => {
    const firstReadyLesson = course.lessons.find((lesson) => lesson.has_quiz_content);
    const firstLesson = firstReadyLesson ?? course.lessons[0];

    setSelectedCourseId(course.course_id);
    setSelectedLessonId(firstLesson?.lesson_id ?? null);
    resetQuiz();
  };

  const handleLessonSelect = (lessonId: number) => {
    setSelectedLessonId(lessonId);
    resetQuiz();
  };

  const resetQuiz = () => {
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedCourseId || !selectedLessonId) {
      toast.error("Select a course and lesson first");
      return;
    }

    if (!selectedLesson?.has_quiz_content) {
      toast.error("This lesson needs PDF/video transcript content before quiz generation");
      return;
    }

    try {
      setGenerating(true);
      setSubmitted(false);
      setAnswers({});
      const data = await quizService.generateQuiz({
        course_id: selectedCourseId,
        lesson_id: selectedLessonId,
        difficulty,
        num_questions: numQuestions,
      });
      setQuiz(data);
      toast.success("Quiz generated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (questionNumber: number, option: QuizOptionKey) => {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [questionNumber]: option }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    if (answeredCount < quiz.questions.length) {
      toast.error("Answer all questions before submitting");
      return;
    }
    setSubmitted(true);
  };

  if (!hasHydrated || (!isAuthenticated && !user)) {
    return <FullPageSpinner />;
  }

  if (user?.role !== "student") {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 overflow-hidden rounded-3xl border border-indigo-400/20 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950/50 p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
              <BrainCircuit size={15} /> AI Practice
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              AI Quiz Generator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Pick one of your enrolled course lessons, generate MCQs from uploaded PDF or
              video transcript content, then submit to check your score instantly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-center sm:min-w-72">
            <div className="rounded-xl bg-slate-900/70 p-4">
              <p className="text-2xl font-bold text-white">{courses.length}</p>
              <p className="text-xs text-slate-500">Enrolled courses</p>
            </div>
            <div className="rounded-xl bg-slate-900/70 p-4">
              <p className="text-2xl font-bold text-white">
                {courses.reduce((total, course) => total + course.lessons.length, 0)}
              </p>
              <p className="text-xs text-slate-500">Available lessons</p>
            </div>
          </div>
        </div>
      </section>

      {loadingCourses ? (
        <div className="flex min-h-[28rem] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/50">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Spinner size="lg" />
            <p className="text-sm">Loading your courses and lessons...</p>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title="No enrolled courses yet"
          description="Enroll in a course first. After that, your course lessons will appear here for AI quiz practice."
          actionLabel="Browse Courses"
          onAction={() => router.push("/courses")}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/60 p-4 shadow-xl shadow-black/20 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <BookOpenCheck size={19} /> Choose course
              </h2>
              <div className="space-y-2">
                {courses.map((course) => {
                  const active = course.course_id === selectedCourseId;
                  return (
                    <button
                      key={course.course_id}
                      type="button"
                      onClick={() => handleCourseSelect(course)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        active
                          ? "border-indigo-400/40 bg-indigo-500/12"
                          : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80",
                      )}
                    >
                      <p className="line-clamp-2 font-semibold text-white">{course.course_title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {course.teacher_name ? `By ${course.teacher_name}` : "Teacher not available"}
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-400"
                          style={{ width: `${Math.min(course.progress, 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <CircleHelp size={19} /> Choose lesson
              </h2>

              {!selectedCourse || selectedCourse.lessons.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
                  No lessons are available in this course yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCourse.lessons.map((lesson) => {
                    const active = lesson.lesson_id === selectedLessonId;
                    return (
                      <button
                        key={lesson.lesson_id}
                        type="button"
                        onClick={() => handleLessonSelect(lesson.lesson_id)}
                        className={cn(
                          "w-full rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                          active
                            ? "border-sky-400/40 bg-sky-500/10"
                            : "border-slate-800 bg-slate-900/30 hover:border-slate-700",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-slate-300">
                            {lesson.order || lesson.lesson_id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold text-white">
                              {lesson.title}
                            </p>
                            <p
                              className={cn(
                                "mt-1 inline-flex items-center gap-1 text-xs",
                                lesson.has_quiz_content ? "text-emerald-300" : "text-amber-300",
                              )}
                            >
                              {lesson.has_quiz_content ? (
                                <CheckCircle2 size={13} />
                              ) : (
                                <Lock size={13} />
                              )}
                              {lesson.has_quiz_content ? "Ready for quiz" : "Needs PDF/video content"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-black/20">
              <div className="grid gap-4 md:grid-cols-[1fr_170px_170px] md:items-end">
                <div>
                  <h2 className="text-xl font-semibold text-white">Generate quiz</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Selected lesson: {selectedLesson ? (
                      <span className="font-semibold text-slate-200">{selectedLesson.title}</span>
                    ) : (
                      <span className="text-amber-300">No lesson selected</span>
                    )}
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Difficulty
                  </span>
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as QuizDifficulty)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  >
                    {QUIZ_DIFFICULTIES.map((item) => (
                      <option key={item} value={item}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Questions
                  </span>
                  <select
                    value={numQuestions}
                    onChange={(event) => setNumQuestions(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  >
                    {[3, 5, 7, 10].map((count) => (
                      <option key={count} value={count}>
                        {count} questions
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleGenerateQuiz}
                  loading={generating}
                  disabled={!selectedLesson?.has_quiz_content}
                >
                  <Sparkles size={17} /> Generate Quiz
                </Button>
                {quiz && (
                  <Button type="button" variant="outline" onClick={resetQuiz}>
                    Clear Quiz
                  </Button>
                )}
              </div>
            </div>

            {!quiz ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/35 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-200">
                  <BrainCircuit size={28} />
                </div>
                <h3 className="text-lg font-semibold text-white">Your quiz will appear here</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Choose a lesson marked “Ready for quiz”, select difficulty, then generate your practice MCQ quiz.
                </p>
              </div>
            ) : (
              <QuizView
                quiz={quiz}
                answers={answers}
                submitted={submitted}
                score={score}
                answeredCount={answeredCount}
                onAnswer={handleAnswer}
                onSubmit={handleSubmit}
                onRegenerate={handleGenerateQuiz}
                generating={generating}
              />
            )}
          </section>
        </div>
      )}
    </main>
  );
}

interface QuizViewProps {
  quiz: QuizResponse;
  answers: Record<number, QuizOptionKey>;
  submitted: boolean;
  score: number;
  answeredCount: number;
  onAnswer: (questionNumber: number, option: QuizOptionKey) => void;
  onSubmit: () => void;
  onRegenerate: () => void;
  generating: boolean;
}

function QuizView({
  quiz,
  answers,
  submitted,
  score,
  answeredCount,
  onAnswer,
  onSubmit,
  onRegenerate,
  generating,
}: QuizViewProps) {
  return (
    <div className="space-y-5" aria-live="polite">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Generated quiz</h2>
            <p className="mt-1 text-sm text-slate-400">
              {answeredCount}/{quiz.questions.length} answered · {quiz.difficulty} level
            </p>
          </div>

          {submitted && (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-200">
                {score}/{quiz.questions.length}
              </p>
              <p className="text-xs text-emerald-300/80">Your score</p>
            </div>
          )}
        </div>
      </div>

      {quiz.questions.map((question) => (
        <QuestionCard
          key={question.question_number}
          question={question}
          selected={answers[question.question_number]}
          submitted={submitted}
          onAnswer={onAnswer}
        />
      ))}

      <div className="flex flex-wrap gap-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
        {!submitted ? (
          <Button type="button" onClick={onSubmit} disabled={answeredCount < quiz.questions.length}>
            Submit Answers
          </Button>
        ) : (
          <Button type="button" onClick={onRegenerate} loading={generating}>
            <Sparkles size={17} /> Generate Again
          </Button>
        )}
      </div>
    </div>
  );
}

interface QuestionCardProps {
  question: QuizQuestion;
  selected?: QuizOptionKey;
  submitted: boolean;
  onAnswer: (questionNumber: number, option: QuizOptionKey) => void;
}

function QuestionCard({ question, selected, submitted, onAnswer }: QuestionCardProps) {
  return (
    <fieldset className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
      <legend className="sr-only">Question {question.question_number}</legend>

      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-bold text-indigo-200">
          {question.question_number}
        </span>
        <h3 className="pt-1 text-base font-semibold leading-7 text-white">
          {question.question}
        </h3>
      </div>

      <div className="grid gap-3">
        {optionKeys.map((key) => {
          const isSelected = selected === key;
          const isCorrect = submitted && question.correct_answer === key;
          const isWrongSelection = submitted && isSelected && question.correct_answer !== key;

          return (
            <label
              key={key}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                "focus-within:ring-2 focus-within:ring-indigo-400/60",
                isCorrect
                  ? "border-emerald-400/50 bg-emerald-500/10"
                  : isWrongSelection
                    ? "border-rose-400/50 bg-rose-500/10"
                    : isSelected
                      ? "border-indigo-400/45 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-900/35 hover:border-slate-700",
                submitted && "cursor-default",
              )}
            >
              <input
                type="radio"
                name={`question-${question.question_number}`}
                value={key}
                checked={isSelected}
                disabled={submitted}
                onChange={() => onAnswer(question.question_number, key)}
                className="mt-1 h-4 w-4 accent-indigo-500"
              />
              <span className="flex-1 text-sm leading-6 text-slate-200">
                <span className="mr-2 font-bold text-slate-400">{key}.</span>
                {question.options[key]}
              </span>
              {isCorrect && <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={18} />}
              {isWrongSelection && <XCircle className="mt-0.5 shrink-0 text-rose-300" size={18} />}
            </label>
          );
        })}
      </div>

      {submitted && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm leading-6 text-slate-300">
          <p className="font-semibold text-white">Explanation</p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      )}
    </fieldset>
  );
}
