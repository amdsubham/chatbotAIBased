import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postShortcutMessagesUpdate, InputType as UpdateShortcutInput } from "../endpoints/shortcut-messages/update_POST.schema";

export const useUpdateShortcutMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateShortcutInput) => postShortcutMessagesUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortcut-messages"] });
    },
  });
};