import api from "@/lib/axios";

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  async getNotifications(limit = 10) {
    const res = await api.get<AppNotification[]>("/notifications", {
      params: { limit },
    });

    return res.data;
  },

  async getUnreadCount() {
    const res = await api.get<{ unread_count: number }>(
      "/notifications/unread-count",
    );

    return res.data;
  },

  async markAsRead(notificationId: number) {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.patch("/notifications/read-all");
    return res.data;
  },
};
