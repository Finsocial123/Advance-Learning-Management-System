import api from "@/lib/axios";
import { Assignment, Submission } from "@/types";

export const assignmentService = {
  async getByCourse(courseId: number) {
    const res = await api.get<Assignment[]>(
      `/assignments/course/${courseId}`
    );
    return res.data;
  },

  async create(
    courseId: number,
    data: {
      title: string;
      description?: string;
      due_date?: string;
    }
  ) {
    const res = await api.post(`/assignments/${courseId}`, data);
    return res.data;
  },

  async update(
    assignmentId: number,
    data: {
      title?: string;
      description?: string;
      due_date?: string;
    }
  ) {
    const res = await api.put(`/assignments/${assignmentId}`, data);
    return res.data;
  },

  async delete(assignmentId: number) {
    const res = await api.delete(`/assignments/${assignmentId}`);
    return res.data;
  },

  async submit(assignmentId: number, file?: File) {
    const formData = new FormData();
    if (file) formData.append("file", file);

    const res = await api.post(
      `/assignments/${assignmentId}/submit`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  async getSubmissions(assignmentId: number) {
    const res = await api.get<Submission[]>(
      `/assignments/${assignmentId}/submissions`
    );
    return res.data;
  },

  async getMySubmission(assignmentId: number) {
    const res = await api.get<Submission>(
      `/assignments/${assignmentId}/my-submission`
    );
    return res.data;
  },

  async gradeSubmission(
    submissionId: number,
    data: { grade: number; feedback?: string }
  ) {
    const res = await api.put(
      `/assignments/submissions/${submissionId}/grade`,
      data
    );
    return res.data;
  },
};