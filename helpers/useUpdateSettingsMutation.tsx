import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postSettingsUpdate, InputType as UpdateSettingsInput } from "../endpoints/settings/update_POST.schema";
import { SETTINGS_QUERY_KEY } from "./useSettingsQuery";

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsInput) => postSettingsUpdate(data),
    onSuccess: (updatedSettings) => {
      // Invalidate the query to refetch the latest settings
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      // Optionally, we can also optimistically update the cache
      queryClient.setQueryData(SETTINGS_QUERY_KEY, updatedSettings);
    },
  });
};