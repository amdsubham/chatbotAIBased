import { useQuery } from "@tanstack/react-query";
import { postEmailSendUnreadReminder } from "../endpoints/email/send-unread-reminder_POST.schema";
import { useAuth } from "./useAuth";

export const useUnreadMessageReminderPolling = () => {
  const { authState } = useAuth();

  // Only run for non-admin users (or when not authenticated)
  const isAdmin = authState.type === "authenticated" && authState.user.role === "admin";

  useQuery({
    queryKey: ["unread-message-reminder-polling"],
    queryFn: async () => {
      try {
        const result = await postEmailSendUnreadReminder({});
        console.log("Unread message reminder check completed:", result);
        return result;
      } catch (error) {
        console.error("Error checking unread message reminders:", error);
        // Don't throw - we want this to be silent
        return null;
      }
    },
    enabled: !isAdmin, // Only enabled for non-admins
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider stale after 4 minutes
    retry: false, // Don't retry on errors to avoid spam
  });
};