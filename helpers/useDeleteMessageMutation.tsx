import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postMessageDelete } from "../endpoints/message/delete_POST.schema";

type MutationVariables = {
  messageId: number;
  chatId: number; // Required to invalidate the correct chat query
};

type UseDeleteMessageMutationOptions = {
  onSuccess?: (deletedMessageId: number) => void;
};

export const useDeleteMessageMutation = ({ onSuccess }: UseDeleteMessageMutationOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: MutationVariables) => postMessageDelete({ messageId: variables.messageId }),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      
      // Invalidate the specific chat to refetch its messages
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
      
      // Invalidate all chats queries (including filtered views) to update the last message preview
      queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });

      if (onSuccess) {
        onSuccess(data.deletedMessageId);
      }
    },
    onError: (error) => {
      console.error("Failed to delete message:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while deleting the message.");
    },
  });
};