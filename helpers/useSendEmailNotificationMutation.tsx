import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { postNotificationSendEmail, InputType } from "../endpoints/notification/send-email_POST.schema";

export const useSendEmailNotificationMutation = () => {
  return useMutation({
    mutationFn: (data: InputType) => postNotificationSendEmail(data),
    onSuccess: (data) => {
      toast.success(data.message || "Email notification sent successfully!");
    },
    onError: (error) => {
      console.error("Failed to send email notification:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to send notification: ${errorMessage}`);
    },
  });
};