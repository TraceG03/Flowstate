import { useEffect, useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { NotificationItem } from '../types';

export function useNotifications() {
  const { state, dispatch } = useApp();
  const reminders = state?.reminders || [];
  const tasks = state?.tasks || [];
  const goals = state?.goals || [];
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (permissionGranted && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `flowstate-${Date.now()}`,
      });
    }
  }, [permissionGranted]);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'dismissed'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
    showBrowserNotification(notification.title, notification.message);
  }, [showBrowserNotification]);

  // Dismiss a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, dismissed: true } : n
    ));
  }, []);

  // Dismiss a reminder in the app state
  const dismissReminder = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_REMINDER', payload: id });
  }, [dispatch]);

  // Clear all dismissed notifications
  const clearDismissed = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.dismissed));
  }, []);

  // Check for due reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      // Check reminders
      reminders.forEach(reminder => {
        if (reminder.dismissed) return;
        
        const reminderTime = new Date(reminder.dateTime);
        if (reminderTime <= now) {
          addNotification({
            title: reminder.title,
            message: reminder.message,
            type: 'reminder',
          });
          dismissReminder(reminder.id);
        }
      });

      // Check tasks with due dates (notify on the day they're due)
      tasks.forEach(task => {
        if (task.status === 'done' || !task.dueDate) return;
        
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        // Check if due today and not already notified
        const notificationKey = `task-due-${task.id}-${task.dueDate}`;
        const alreadyNotified = localStorage.getItem(notificationKey);
        
        if (dueDate.getTime() === today.getTime() && !alreadyNotified) {
          addNotification({
            title: 'Task Due Today',
            message: task.title,
            type: 'task',
          });
          localStorage.setItem(notificationKey, 'true');
        }
      });

      // Check goals with target dates
      goals.forEach(goal => {
        if (goal.achieved || !goal.targetDate) return;
        
        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        
        // Check if target is today and not already notified
        const notificationKey = `goal-due-${goal.id}-${goal.targetDate}`;
        const alreadyNotified = localStorage.getItem(notificationKey);
        
        if (targetDate.getTime() === today.getTime() && !alreadyNotified) {
          addNotification({
            title: 'Goal Target Date Today',
            message: `${goal.title} (${goal.progress}% complete)`,
            type: 'goal',
          });
          localStorage.setItem(notificationKey, 'true');
        }
      });
    };

    // Check immediately on mount
    checkReminders();

    // Check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [reminders, tasks, goals, addNotification, dismissReminder]);

  const activeNotifications = notifications.filter(n => !n.dismissed);

  return {
    notifications: activeNotifications,
    allNotifications: notifications,
    addNotification,
    dismissNotification,
    clearDismissed,
    permissionGranted,
    requestPermission: () => {
      if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      }
    },
  };
}
