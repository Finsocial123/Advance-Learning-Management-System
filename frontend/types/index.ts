export type Role = "student" | "teacher" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  teacher_id: number;
  teacher_name: string | null;
  created_at: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string | null;
  order: number;
  video_url: string | null;
  pdf_url: string | null;
  external_video_link: string | null;
  course_id: number;
  created_at: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  course_id: number;
  created_at: string;
}

export interface Submission {
  id: number;
  student_id: number;
  student_name: string | null;
  assignment_id: number;
  file_url: string | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
}

export interface Enrollment {
  enrollment_id: number;
  course_id: number;
  course_title: string | null;
  teacher_name: string | null;
  progress: number;
  enrolled_at: string;
}

export interface LessonProgressItem {
  lesson_id: number;
  title: string;
  order: number;
  completed: boolean;
  completed_at: string | null;
  has_video?: boolean;
  has_trackable_video?: boolean;
  watched_seconds?: number;
  video_duration_seconds?: number;
  required_watch_seconds?: number;
  watch_percentage?: number;
  can_mark_complete?: boolean;
}

export interface VideoWatchProgress {
  watched_seconds: number;
  video_duration_seconds: number;
  required_watch_seconds: number;
  watch_percentage: number;
  can_mark_complete: boolean;
}

export interface CourseProgress {
  course_id: number;
  overall_progress: number;
  total_lessons: number;
  completed_lessons: number;
  lessons: LessonProgressItem[];
}

// ---------- Admin user management types ----------

export interface AdminUserListItem extends User {
  total_courses?: number;
  total_enrolled_courses?: number;
  average_progress?: number;
}

export interface PaginatedUsersResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TeacherCourseReport {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  total_lessons: number;
  total_enrolled_students: number;
  created_at: string;
}

export interface TeacherReport {
  total_courses: number;
  courses: TeacherCourseReport[];
}

export interface StudentLessonProgressReport {
  lesson_id: number;
  title: string;
  order: number;
  completed: boolean;
  completed_at: string | null;
}

export interface StudentCourseProgressReport {
  course_id: number;
  course_title: string;
  teacher_name: string;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
  pending_lessons: number;
  lessons: StudentLessonProgressReport[];
}

export interface StudentReport {
  total_enrolled_courses: number;
  average_progress: number;
  courses: StudentCourseProgressReport[];
}

export interface AdminUserDetails {
  user: User;
  teacher_report: TeacherReport | null;
  student_report: StudentReport | null;
}

// ---------- Dashboard types ----------

export interface StudentProgressItem {
  student_id: number;
  student_name: string;
  progress: number;
}

export interface CourseWithStats {
  course_id: number;
  course_title: string;
  total_lessons: number;
  total_enrolled: number;
  students: StudentProgressItem[];
}

export interface TeacherStat {
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  total_courses: number;
  courses: string[];
}

export interface StudentStat {
  student_id: number;
  student_name: string;
  student_email: string;
  total_enrolled: number;
  enrolled_courses: string[];
}

export interface AdminDashboardData {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_courses: number;
  teachers: TeacherStat[];
  students: StudentStat[];
}

export interface TeacherDashboardData {
  total_courses: number;
  total_lessons: number;
  total_enrolled_students: number;
  courses: CourseWithStats[];
}

export interface EnrolledCourseProgress {
  course_id: number;
  course_title: string;
  teacher_name: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
}

export interface StudentDashboardData {
  total_enrolled: number;
  courses: EnrolledCourseProgress[];
}

export interface EnrolledStudent {
  enrollment_id?: number;
  student_id: number;
  student_name: string;
  student_email: string;
  progress: number;
  total_lessons?: number;
  completed_lessons?: number;
  pending_lessons?: number;
  enrolled_at: string;
  lessons?: CourseStudentLessonProgress[];
}

export interface CourseStudentLessonProgress {
  lesson_id: number;
  title: string;
  order: number;
  completed: boolean;
  completed_at: string | null;
  has_video: boolean;
  watched_seconds: number;
  video_duration_seconds: number;
}

export interface CourseStudentProgressReport extends EnrolledStudent {
  enrollment_id: number;
  total_lessons: number;
  completed_lessons: number;
  pending_lessons: number;
  lessons: CourseStudentLessonProgress[];
}

export interface CourseStudentsProgressResponse {
  course: Course;
  total_students: number;
  average_progress: number;
  students: CourseStudentProgressReport[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

// ---------- AI Quiz Generator types ----------

export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuizOptionKey = "A" | "B" | "C" | "D";

export interface QuizLesson {
  lesson_id: number;
  title: string;
  description: string | null;
  order: number;
  has_quiz_content: boolean;
}

export interface QuizCourse {
  course_id: number;
  course_title: string;
  teacher_name: string | null;
  progress: number;
  enrolled_at: string;
  lessons: QuizLesson[];
}

export interface QuizGeneratePayload {
  course_id: number;
  lesson_id: number;
  num_questions: number;
  difficulty: QuizDifficulty;
}

export interface QuizQuestion {
  question_number: number;
  question: string;
  options: Record<QuizOptionKey, string>;
  correct_answer: QuizOptionKey;
  explanation: string;
}

export interface QuizResponse {
  lesson_id: number;
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
}
