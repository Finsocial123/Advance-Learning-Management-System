from pydantic import BaseModel
from typing import List, Optional


# ---------- shared ----------

class StudentProgressItem(BaseModel):
    student_id: int
    student_name: str
    progress: float


class CourseWithStats(BaseModel):
    course_id: int
    course_title: str
    total_lessons: int
    total_enrolled: int
    students: List[StudentProgressItem]


# ---------- Admin ----------

class TeacherStat(BaseModel):
    teacher_id: int
    teacher_name: str
    teacher_email: str
    total_courses: int
    courses: List[str]


class StudentStat(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    total_enrolled: int
    enrolled_courses: List[str]


class AdminDashboard(BaseModel):
    total_users: int
    total_teachers: int
    total_students: int
    total_courses: int
    teachers: List[TeacherStat]
    students: List[StudentStat]


# ---------- Teacher ----------

class TeacherDashboard(BaseModel):
    total_courses: int
    total_lessons: int
    total_enrolled_students: int
    courses: List[CourseWithStats]


# ---------- Student ----------

class EnrolledCourseProgress(BaseModel):
    course_id: int
    course_title: str
    teacher_name: str
    progress: float
    completed_lessons: int
    total_lessons: int


class StudentDashboard(BaseModel):
    total_enrolled: int
    courses: List[EnrolledCourseProgress]