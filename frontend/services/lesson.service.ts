import api from "@/lib/axios";
import { Lesson } from "@/types";

export const lessonService = {
  async getByCourse(courseId: number) {
    const res = await api.get<Lesson[]>(`/lessons/course/${courseId}`);
    return res.data;
  },

  async getById(lessonId: number) {
    const res = await api.get<Lesson>(`/lessons/${lessonId}`);
    return res.data;
  },

  async create(
    courseId: number,
    data: {
      title: string;
      description?: string;
      order?: number;
      external_video_link?: string;
      video?: File | null;
      pdf?: File | null;
    }
  ) {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.order !== undefined)
      formData.append("order", String(data.order));
    if (data.external_video_link)
      formData.append("external_video_link", data.external_video_link);
    if (data.video) formData.append("video", data.video);
    if (data.pdf) formData.append("pdf", data.pdf);

    const res = await api.post(`/lessons/${courseId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async update(
    lessonId: number,
    data: {
      title?: string;
      description?: string;
      order?: number;
      external_video_link?: string;
      video?: File | null;
      pdf?: File | null;
    }
  ) {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description !== undefined)
      formData.append("description", data.description);
    if (data.order !== undefined)
      formData.append("order", String(data.order));
    if (data.external_video_link !== undefined)
      formData.append("external_video_link", data.external_video_link);
    if (data.video) formData.append("video", data.video);
    if (data.pdf) formData.append("pdf", data.pdf);

    const res = await api.put(`/lessons/${lessonId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async delete(lessonId: number) {
    const res = await api.delete(`/lessons/${lessonId}`);
    return res.data;
  },
};