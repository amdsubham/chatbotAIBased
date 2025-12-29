import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postMessagesMarkViewed, InputType as MarkMessagesViewedInput } from "../endpoints/messages/mark-viewed_POST.schema";

export const useMarkMessagesViewedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkMessagesViewedInput) => postMessagesMarkViewed(data),
    onSuccess: (data, variables) => {
      // Invalidate the specific chat to refetch messages and update viewed status.
      queryClient.invalidateQueries({ queryKey: ["chat", variables.chatId] });
      // Also invalidate all chats queries (including filtered views), as they might display unread counts.
      queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });
    },
    onError: (error) => {
      console.error("Error marking messages as viewed:", error);
    },
  });
};