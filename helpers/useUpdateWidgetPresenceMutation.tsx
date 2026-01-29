import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postChatWidgetPresence, type InputType } from "../endpoints/chat/widget-presence_POST.schema";

export const useUpdateWidgetPresenceMutation = (apiBaseUrl?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postChatWidgetPresence(data, apiBaseUrl),
    onSuccess: (_data, variables) => {
      // Invalidate the specific chat query to get the latest presence data
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });

      // Invalidate the chats list query so admin dashboard shows updated online status immediately
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error) => {
      // Per requirements, this is a silent background operation.
      // We only log errors for debugging purposes and do not show user-facing notifications.
      console.error("Failed to update widget presence:", error);
    },
  });
};