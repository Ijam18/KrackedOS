"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationPermissionState = NotificationPermission | "unsupported";

interface NotifyOptions extends NotificationOptions {
  /** URL to navigate to when notification is clicked */
  url?: string;
}

interface UseBrowserNotificationReturn {
  permission: NotificationPermissionState;
  requestPermission: () => Promise<NotificationPermission | null>;
  notify: (title: string, options?: NotifyOptions) => Notification | null;
}

/**
 * Hook for managing browser notifications.
 *
 * Features:
 * - Checks if notifications are supported
 * - Requests permission on demand
 * - Only shows notifications when tab is not focused
 * - Clicking notification focuses the tab
 */
export function useBrowserNotification(): UseBrowserNotificationReturn {
  const [permission, setPermission] =
    useState<NotificationPermissionState>("default");

  // Initialize permission state
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Request notification permission
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission | null> => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
      }

      // Already granted or denied
      if (Notification.permission !== "default") {
        return Notification.permission;
      }

      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch {
        // Some browsers use callback-based API
        return new Promise((resolve) => {
          Notification.requestPermission((result) => {
            setPermission(result);
            resolve(result);
          });
        });
      }
    }, []);

  // Send a notification (only if tab is hidden and permission granted)
  const notify = useCallback(
    (title: string, options?: NotifyOptions): Notification | null => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
      }

      // Only notify if permission granted and tab is hidden
      if (Notification.permission !== "granted") {
        return null;
      }

      // Don't notify if user is already looking at the tab
      if (!document.hidden) {
        return null;
      }

      const { url, ...notificationOptions } = options ?? {};

      const notification = new Notification(title, {
        icon: "/favicon.ico",
        ...notificationOptions,
      });

      // Navigate to URL or just focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        if (url) {
          window.location.href = url;
        }
        notification.close();
      };

      return notification;
    },
    [],
  );

  return {
    permission,
    requestPermission,
    notify,
  };
}
