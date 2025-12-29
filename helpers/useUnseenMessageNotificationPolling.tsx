import { useEffect } from 'react';
import { useCheckUnseenNotificationsMutation } from './useCheckUnseenNotificationsMutation';

const POLLING_INTERVAL_MS = 900000; // 15 minutes (reduced to minimize Brevo IP alerts)

/**
 * A React hook that periodically triggers a background check for unseen notifications.
 * This is intended to trigger email notifications for users who have been inactive.
 *
 * - Polls every 5 minutes.
 * - Only performs the check if the document/tab is currently visible.
 * - Cleans up the polling interval on component unmount.
 * - Errors are handled silently by logging to the console.
 */
export const useUnseenMessageNotificationPolling = () => {
  const { mutate } = useCheckUnseenNotificationsMutation();

  useEffect(() => {
    const runCheck = () => {
      // Only run the check if the page is visible to the user
      if (!document.hidden) {
        console.log('Polling for unseen notifications to trigger email alerts...');
        mutate({});
      }
    };

    // Run the check immediately when the hook mounts (if visible)
    runCheck();

    // Set up the interval for periodic polling
    const intervalId = setInterval(runCheck, POLLING_INTERVAL_MS);

    // Cleanup function to clear the interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [mutate]);

  // This hook does not return anything as it's purely for side effects.
};