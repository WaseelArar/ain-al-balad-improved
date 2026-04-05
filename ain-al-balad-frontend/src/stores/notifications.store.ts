import apiInstance from "$lib/api/api";
import { writable } from "svelte/store";

export interface Notification {
  notificationsId: number;
  usersId: number;
  issuesId?: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  issueDescription?: string;
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
}

const { subscribe, update, set } = writable<NotificationsState>({
  items: [],
  unreadCount: 0,
  loading: false,
});

export const notificationsStore = {
  subscribe,

  async fetch() {
    update((s) => ({ ...s, loading: true }));
    try {
      const res = await apiInstance.get("/notifications");
      set({ items: res.data.notifications, unreadCount: res.data.unreadCount, loading: false });
    } catch {
      update((s) => ({ ...s, loading: false }));
    }
  },

  async markAllRead() {
    try {
      await apiInstance.patch("/notifications/read-all");
      update((s) => ({
        ...s,
        items: s.items.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error(err);
    }
  },
};
