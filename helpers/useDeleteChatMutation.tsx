import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postChatDelete, type InputType } from "../endpoints/chat/delete_POST.schema";

type UseDeleteChatMutationOptions = {
  onSuccess?: (deletedChatIds: number[]) => void;
};

export const useDeleteChatMutation = ({ onSuccess }: UseDeleteChatMutationOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postChatDelete(data),
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate all chats queries (including filtered views) to refresh the UI
      queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });
      // Call the optional callback, e.g., to close the chat detail view
      if (onSuccess) {
        onSuccess(data.deletedChatIds);
      }
    },
    onError: (error) => {
      console.error("Failed to delete chat:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while deleting the chat.");
    },
  });
};