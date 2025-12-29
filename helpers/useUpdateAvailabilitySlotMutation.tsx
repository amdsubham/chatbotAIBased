import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postAvailabilitySlotsUpdate, InputType as UpdateSlotInput } from "../endpoints/availability-slots/update_POST.schema";

export const useUpdateAvailabilitySlotMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSlotInput) => postAvailabilitySlotsUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
};