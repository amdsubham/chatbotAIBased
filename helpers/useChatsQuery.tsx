import { useQuery } from "@tanstack/react-query";
import { getChats, InputType as GetChatsInput } from "../endpoints/chats_GET.schema";

export const useChatsQuery = (params?: GetChatsInput) => {
  return useQuery({
    queryKey: ["chats", params],
    queryFn: () => getChats(params),
    refetchOnWindowFocus: true,
    staleTime: 5000,
    placeholderData: (previousData) => previousData,
  });
};