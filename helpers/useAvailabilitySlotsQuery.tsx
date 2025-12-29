import { useQuery } from "@tanstack/react-query";
import { getAvailabilitySlots } from "../endpoints/availability-slots_GET.schema";

export const useAvailabilitySlotsQuery = () => {
  return useQuery({
    queryKey: ["availability-slots"],
    queryFn: () => getAvailabilitySlots(),
  });
};