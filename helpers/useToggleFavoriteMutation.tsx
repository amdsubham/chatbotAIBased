import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postFavoritesToggle, InputType } from "../endpoints/favorites/toggle_POST.schema";

export const useToggleFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postFavoritesToggle(data),
    onMutate: async ({ chatId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const prev = queryClient.getQueryData<number[]>(["favorites"]) || [];
      const next = prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId];
      queryClient.setQueryData(["favorites"], next);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["favorites"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};
