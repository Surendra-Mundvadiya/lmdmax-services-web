import { create } from "zustand";
import { axiosInstance } from "../api/axiosClient";
import type { AppNotification } from "../types/admin";

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

interface NotificationStoreState {
  notifications: AppNotification[];
  isLoading: boolean;
  filterCategory: "all" | "unread" | "dispatch" | "dvic" | "checkout" | "system";
  fetchNotifications: () => Promise<void>;
  setFilterCategory: (cat: "all" | "unread" | "dispatch" | "dvic" | "checkout" | "system") => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  isLoading: false,
  filterCategory: "all",

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("notifications/v1/notifications");
      const rawData = res.data?.data || res.data || [];
      const list = Array.isArray(rawData) ? rawData : [];
      const mapped: AppNotification[] = list.map((item: any, idx: number) => ({
        id: item.id ? String(item.id) : `notif-${idx}`,
        title: item.title || item.subject || "Notification Alert",
        message: item.message || item.body || item.text || "",
        type: (item.type || item.severity || "info") as any,
        category: (item.category || "system") as any,
        timestamp: item.timestamp || item.created_at || "Just now",
        read: Boolean(item.is_read || item.read),
        station_code: item.station_code || item.station,
        action_label: item.action_label || item.link_text,
        action_url: item.action_url || item.url,
      }));
      set({ notifications: mapped, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setFilterCategory: (cat) => set({ filterCategory: cat }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));

