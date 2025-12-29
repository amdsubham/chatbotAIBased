import { useQuery } from "@tanstack/react-query";
import { getShortcutMessages } from "../endpoints/shortcut-messages_GET.schema";

export const useShortcutMessagesQuery = () => {
  return useQuery({
    queryKey: ["shortcut-messages"],
    queryFn: () => getShortcutMessages(),
  });
};