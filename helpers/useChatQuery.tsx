import { useQuery } from "@tanstack/react-query";
import { getChat, InputType as GetChatInput } from "../endpoints/chat_GET.schema";

export const useChatQuery = (params: GetChatInput, options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery({
    queryKey: ["chat", params.chatId],
    queryFn: () => getChat(params),
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
    staleTime: 3000,
    placeholderData: (previousData) => previousData,
    refetchInterval: options?.refetchInterval,
  });
};