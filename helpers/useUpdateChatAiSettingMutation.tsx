import { useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postChatUpdateAiSetting, type InputType } from "../endpoints/chat/update-ai-setting_POST.schema";
import { OutputType as ChatOutputType } from "../endpoints/chat_GET.schema";

export interface UpdateChatAiSettingMutationConfig {
  invalidateChatLists?: boolean;
  invalidateChatDetail?: boolean;
}

/**
 * A React Query mutation hook for updating a chat's AI auto-response setting.
 *
 * This hook wraps the `postChatUpdateAiSetting` API call and handles state management,
 * caching, and UI feedback (toasts).
 *
 * @param config - Optional configuration to control cache invalidation behavior
 * @param config.invalidateChatLists - Whether to invalidate chat list queries (default: true)
 * @param config.invalidateChatDetail - Whether to invalidate individual chat detail queries (default: true)
 * @returns A mutation object from `useMutation` that can be used to trigger the update.
 *
 * @example
 * const updateAiSettingMutation = useUpdateChatAiSettingMutation();
 *
 * const handleToggle = (chatId: number, isEnabled: boolean) => {
 *   updateAiSettingMutation.mutate({ chatId, aiAutoResponseEnabled: isEnabled });
 * };
 *
 * @example
 * // For bulk operations, disable automatic list invalidation
 * const updateAiSettingMutation = useUpdateChatAiSettingMutation({ invalidateChatLists: false });
 */
export const useUpdateChatAiSettingMutation = (config?: UpdateChatAiSettingMutationConfig) => {
  const { invalidateChatLists = true, invalidateChatDetail = true } = config || {};
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postChatUpdateAiSetting(data),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat', variables.chatId] });

      // Snapshot the previous value
      const previousChat = queryClient.getQueryData<ChatOutputType>(['chat', variables.chatId]);

      // Optimistically update the cache
      if (previousChat) {
        queryClient.setQueryData<ChatOutputType>(['chat', variables.chatId], {
          ...previousChat,
          aiAutoResponseEnabled: variables.aiAutoResponseEnabled,
        });
      }

      // Return context object with the snapshotted value
      return { previousChat };
    },
    onSuccess: (data) => {
      const status = data.aiAutoResponseEnabled === null ? "reset to default" : (data.aiAutoResponseEnabled ? "enabled" : "disabled");
      toast.success(`AI auto-response for this chat has been ${status}.`);
      

    },
    onError: (error, variables, context) => {
      // Revert the optimistic update on error
      if (context?.previousChat) {
        queryClient.setQueryData(['chat', variables.chatId], context.previousChat);
      }
      
      console.error("Failed to update chat AI setting:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to update AI setting: ${errorMessage}`);
    },
    onSettled: (data) => {
      // Always refetch after error or success to ensure we have the latest data
      if (data) {
        if (invalidateChatLists) {
          queryClient.invalidateQueries({ 
            predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
          });
        }
        if (invalidateChatDetail) {
          queryClient.invalidateQueries({ queryKey: ['chat', data.id] });
        }
      }
    },
  });
};