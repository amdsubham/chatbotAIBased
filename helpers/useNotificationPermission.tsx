import { useState, useEffect, useCallback } from 'react';

type PermissionStatus = 'granted' | 'denied' | 'default';

/**
 * A React hook to manage browser notification permissions.
 * It checks for browser support, retrieves the current permission status,
 * and provides a function to request permission from the user.
 */
export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<PermissionStatus>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission as PermissionStatus);
    } else {
      setIsSupported(false);
      console.warn('This browser does not support desktop notifications.');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.error('Cannot request permission: Notifications not supported by this browser.');
      return;
    }

    try {
      const status = await Notification.requestPermission();
      setPermission(status as PermissionStatus);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, [isSupported]);

  return { permission, requestPermission, isSupported };
};