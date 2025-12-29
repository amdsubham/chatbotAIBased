import { useQuery } from "@tanstack/react-query";
import { getSettings } from "../endpoints/settings_GET.schema";

export const SETTINGS_QUERY_KEY = ["settings"] as const;

export const useSettingsQuery = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => getSettings(),
  });
};