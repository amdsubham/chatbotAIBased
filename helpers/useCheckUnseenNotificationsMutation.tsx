import { useMutation } from "@tanstack/react-query";
import { postMessagesCheckUnseenNotifications, InputType as CheckUnseenNotificationsInput } from "../endpoints/messages/check-unseen-notifications_POST.schema";

export const useCheckUnseenNotificationsMutation = () => {
  return useMutation({
    mutationFn: (data: CheckUnseenNotificationsInput) => postMessagesCheckUnseenNotifications(data),
    onError: (error) => {
      console.error("Error checking for unseen notifications:", error);
    },
  });
};