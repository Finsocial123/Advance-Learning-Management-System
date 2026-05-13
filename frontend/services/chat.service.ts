import api from "@/lib/axios";

export interface ChatSession {
  id: string;
  title: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  created_at: string;
  session_id: string;
  user_id: number;
  tool_calls: any[] | null;
}

export const chatService = {
  async createSession(userId: number) {
    const res = await api.post<ChatSession>(
      `/sessions/${userId}/sessions`,
      { user_id: userId }
    );
    return res.data;
  },

  async getSessions(userId: number) {
    const res = await api.get<ChatSession[]>(`/sessions/${userId}/sessions`);
    return res.data;
  },

  async getMessages(sessionId: string) {
    const res = await api.get<ChatMessage[]>(
      `/sessions/${sessionId}/messages`
    );
    return res.data;
  },

  async sendMessage(
    sessionId: string,
    userId: number,
    content: string,
    lessonId?: number | null
  ) {
    const payload = {
      user_id: userId,
      content,
      lesson_id: lessonId,
      model: "openrouter/free",
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://103.180.163.187:60007"}/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error("Chat request failed");
    if (!res.body) throw new Error("No response body");

    return res.body.getReader();
  },


  async deleteSession(
    sessionId: string,
  ) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://103.180.163.187:60007"}/sessions/${sessionId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(res)
    if (!res.ok) throw new Error("Delete request failed");

    return res.json();
  },
};
