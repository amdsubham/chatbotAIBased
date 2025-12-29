import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postChatCreate, InputType as CreateChatInput } from "../endpoints/chat/create_POST.schema";

export const useCreateChatMutation = (apiBaseUrl?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatInput) => postChatCreate(data, undefined, apiBaseUrl),
    onSuccess: () => {
      // Invalidate all chats queries (including filtered views) to show the new chat
      queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });
    },
  });
};