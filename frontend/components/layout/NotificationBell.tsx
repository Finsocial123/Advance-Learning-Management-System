"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Radio } from "lucide-react";

import {
  AppNotification,
  notificationService,
} from "@/services/notification.service";

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      // Navbar should not break if this request fails.
    }
  };

  const loadNotifications = async () => {
    setLoading(true);

    try {
      const data = await notificationService.getNotifications(10);
      setNotifications(data);
    } catch {
      // Navbar should not break if this request fails.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();

    const interval = window.setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id);
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // Still navigate if mark-as-read fails.
    }

    setOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((items) =>
        items.map((item) => ({ ...item, is_read: true })),
      );
    } catch {
      // Ignore to keep UI stable.
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-85 overflow-hidden rounded-2xl border border-slate-800 bg-[#080910] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <p className="text-xs text-slate-500">
                Live classes and course updates
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/10"
              >
                <CheckCheck size={14} />
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-95 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full gap-3 border-b border-slate-800/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-900 ${
                    !notification.is_read ? "bg-indigo-500/6" : ""
                  }`}
                >
                  <div
                    className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      notification.notification_type === "live_started"
                        ? "bg-rose-500/10 text-rose-300"
                        : "bg-indigo-500/10 text-indigo-300"
                    }`}
                  >
                    <Radio size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {notification.title}
                      </p>

                      {!notification.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-600">
                      {formatNotificationTime(notification.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
