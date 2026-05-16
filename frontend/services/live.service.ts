import api from "@/lib/axios";

export interface LiveSessionJoinResponse {
  active?: boolean;
  session_id: number;
  title: string;
  room_name: string;
  status: "scheduled" | "live" | "ended";
  livekit_url: string;
  token: string;
  can_publish?: boolean;
}

export const liveService = {
  async startCourseLive(courseId: number) {
    const res = await api.post<LiveSessionJoinResponse>(
      `/live-sessions/course/${courseId}/start`,
    );

    return res.data;
  },

  async getActiveCourseLive(courseId: number) {
    const res = await api.get<LiveSessionJoinResponse | { active: false }>(
      `/live-sessions/course/${courseId}/active`,
    );

    return res.data;
  },

  async endLiveSession(sessionId: number) {
    const res = await api.patch(`/live-sessions/${sessionId}/end`);

    return res.data;
  },
};
