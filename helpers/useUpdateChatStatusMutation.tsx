import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postChatUpdateStatus, type InputType } from "../endpoints/chat/update-status_POST.schema";

export const useUpdateChatStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postChatUpdateStatus(data),
    onSuccess: (data) => {
      toast.success(`Chat status updated to "${data.status}".`);
      // Invalidate all chat list queries regardless of filter parameters
      queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });
      // Invalidate the specific chat query to get the latest data
      queryClient.invalidateQueries({ queryKey: ['chat', data.id] });
    },
    onError: (error) => {
      console.error("Failed to update chat status:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while updating chat status.");
    },
  });
};