import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postAvailabilitySlotsCreate, InputType as CreateSlotInput } from "../endpoints/availability-slots/create_POST.schema";

export const useCreateAvailabilitySlotMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSlotInput) => postAvailabilitySlotsCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
};