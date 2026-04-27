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
}

export interface CourseProgress {
  course_id: number;
  overall_progress: number;
  total_lessons: number;
  completed_lessons: number;
  lessons: LessonProgressItem[];
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
  student_id: number;
  student_name: string;
  student_email: string;
  progress: number;
  enrolled_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
  user_id: number;
  name: string;
}