import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postShortcutMessagesDelete, InputType as DeleteShortcutInput } from "../endpoints/shortcut-messages/delete_POST.schema";

export const useDeleteShortcutMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteShortcutInput) => postShortcutMessagesDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortcut-messages"] });
    },
  });
};