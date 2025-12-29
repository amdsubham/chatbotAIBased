import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postShortcutMessagesCreate, InputType as CreateShortcutInput } from "../endpoints/shortcut-messages/create_POST.schema";

export const useCreateShortcutMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShortcutInput) => postShortcutMessagesCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortcut-messages"] });
    },
  });
};