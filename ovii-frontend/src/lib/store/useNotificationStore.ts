import { create } from 'zustand';
import api from '../api';

// --- Interfaces for Notification Data ---
export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  channel?: string;
}

// --- The Notification Store State Definition ---
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
}

// --- The Zustand Store Implementation ---
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications/notifications/');
      const notifications = response.data as Notification[];
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.is_read).length,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false, error: 'Failed to fetch notifications' });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      // Check if notification already exists to avoid duplicates
      const exists = state.notifications.some((n) => n.id === notification.id);
      if (exists) {
        return state;
      }
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
      };
    });
  },

  markAsRead: async (id: number) => {
    // Optimistically update UI
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await api.patch(`/notifications/notifications/${id}/`, { is_read: true });
    } catch (error) {
      // Revert optimistic update on failure
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      });
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    // Optimistically update UI
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    try {
      await api.post('/notifications/notifications/mark_all_read/');
    } catch (error) {
      // Revert optimistic update on failure
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      });
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
