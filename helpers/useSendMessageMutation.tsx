import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postMessageSend, InputType as SendMessageInput, OutputType } from "../endpoints/message/send_POST.schema";
import { toast } from "sonner";

type ChatData = {
  messages: OutputType[];
};

export const useSendMessageMutation = (apiBaseUrl?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageInput) => postMessageSend(data, undefined, apiBaseUrl),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this chat
      await queryClient.cancelQueries({ queryKey: ["chat", variables.chatId] });

      // Snapshot the previous value
      const previousChat = queryClient.getQueryData<ChatData>(["chat", variables.chatId]);

      // Optimistically update the cache with a temporary message
      if (previousChat) {
        const optimisticMessage: OutputType = {
          id: -Date.now(), // Temporary negative ID based on timestamp
          chatId: variables.chatId,
          sender: variables.sender,
          content: variables.content,
          imageUrl: variables.imageUrl || null,
          createdAt: new Date(),
          viewedAt: null,
          emailNotificationSentForMessage: false,
        };

        queryClient.setQueryData<ChatData>(["chat", variables.chatId], {
          ...previousChat,
          messages: [...previousChat.messages, optimisticMessage],
        });
      }

      // Return context with the previous data for rollback
      return { previousChat };
    },
    onError: (error, variables, context) => {
      // Rollback to the previous data
      if (context?.previousChat) {
        queryClient.setQueryData(["chat", variables.chatId], context.previousChat);
      }

      // Show error toast to user
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error("Failed to send message", {
        description: errorMessage,
      });

      console.error("Error sending message:", error);
    },
    onSuccess: (data, variables) => {
      // Invalidate all chats queries (including filtered views) to update latest message
      // and the specific chat's message list to fetch the real server data
      queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });
      queryClient.invalidateQueries({ queryKey: ["chat", variables.chatId] });
    },
  });
};