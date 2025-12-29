import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { postMessageSendToUserEmail, InputType } from "../endpoints/message/send-to-user-email_POST.schema";

export const useSendMessageToUserEmailMutation = () => {
  return useMutation({
    mutationFn: (data: InputType) => postMessageSendToUserEmail(data),
    onSuccess: (data) => {
      toast.success(data.message || "Message sent to user successfully!");
    },
    onError: (error) => {
      console.error("Failed to send message to user email:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to send message: ${errorMessage}`);
    },
  });
};