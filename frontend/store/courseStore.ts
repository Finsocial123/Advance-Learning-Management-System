import { create } from "zustand";
import { Course, Lesson, Assignment } from "@/types";

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  currentLessons: Lesson[];
  currentAssignments: Assignment[];

  setCourses: (courses: Course[]) => void;
  setCurrentCourse: (course: Course | null) => void;
  setCurrentLessons: (lessons: Lesson[]) => void;
  setCurrentAssignments: (assignments: Assignment[]) => void;
  clearCurrent: () => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  currentCourse: null,
  currentLessons: [],
  currentAssignments: [],

  setCourses: (courses) => set({ courses }),
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setCurrentLessons: (lessons) => set({ currentLessons: lessons }),
  setCurrentAssignments: (assignments) => set({ currentAssignments: assignments }),
  clearCurrent: () =>
    set({
      currentCourse: null,
      currentLessons: [],
      currentAssignments: [],
    }),
}));