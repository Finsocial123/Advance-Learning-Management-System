import api from "@/lib/axios";
import { Course } from "@/types";

export const courseService = {
  async getAll(search?: string) {
    const params = search ? { search } : {};
    const res = await api.get<Course[]>("/courses", { params });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<Course>(`/courses/${id}`);
    return res.data;
  },

  async getMyCreated() {
    const res = await api.get<Course[]>("/courses/my-created");
    return res.data;
  },

  async create(data: {
    title: string;
    description?: string;
    thumbnail?: File | null;
  }) {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

    const res = await api.post("/courses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      thumbnail?: File | null;
    }
  ) {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description !== undefined)
      formData.append("description", data.description);
    if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

    const res = await api.put(`/courses/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete(`/courses/${id}`);
    return res.data;
  },

  async getEnrolledStudents(courseId: number) {
    const res = await api.get(`/courses/${courseId}/students`);
    return res.data;
  },
};