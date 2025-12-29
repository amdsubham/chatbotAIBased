import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postAvailabilitySlotsDelete, InputType as DeleteSlotInput } from "../endpoints/availability-slots/delete_POST.schema";

export const useDeleteAvailabilitySlotMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteSlotInput) => postAvailabilitySlotsDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
};