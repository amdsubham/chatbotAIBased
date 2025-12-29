import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postChatSubmitRating, type InputType } from "../endpoints/chat/submit-rating_POST.schema";

/**
 * A React Query mutation hook for submitting a rating and feedback for a chat.
 * It wraps the `postChatSubmitRating` API client function.
 *
 * On success, it provides user feedback via a toast and invalidates relevant queries
 * to ensure the UI reflects the updated chat data.
 *
 * @returns The mutation object from `useMutation`, containing methods like `mutate`, `mutateAsync`, and status flags like `isPending`.
 */
export const useSubmitRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postChatSubmitRating(data),
    onSuccess: (data, variables) => {
      toast.success("Thank you for your feedback!");
      
      // Invalidate all chats queries (including filtered views) to reflect the change (e.g., showing a rating icon)
      queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });
      
      // Invalidate the specific chat query to get the latest data, including the new rating
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
    },
    onError: (error) => {
      console.error("Failed to submit rating:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while submitting your rating.");
    },
  });
};