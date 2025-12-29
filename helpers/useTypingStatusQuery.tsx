import { useQuery } from "@tanstack/react-query";
import { getTypingStatus, InputType as GetTypingStatusInput } from "../endpoints/typing/status_GET.schema";

interface UseTypingStatusQueryProps {
  chatId: number;
  expirationSeconds?: number;
  enabled?: boolean;
}

/**
 * A React Query query hook for fetching the current typing status for a chat.
 * It wraps the `getTypingStatus` API client function and polls for updates.
 *
 * @param {object} props - The properties for the query.
 * @param {number} props.chatId - The ID of the chat to fetch typing status for.
 * @param {number} [props.expirationSeconds=5] - The window in seconds to consider a typing event as active.
 * @param {boolean} [props.enabled=true] - A flag to enable or disable the query and polling.
 * @returns The query object from `useQuery`, including data, isFetching, and error states.
 */
export const useTypingStatusQuery = ({
  chatId,
  expirationSeconds = 5,
  enabled = true,
}: UseTypingStatusQueryProps) => {
  return useQuery({
    queryKey: ["typingStatus", chatId],
    queryFn: () => getTypingStatus({ chatId, expirationSeconds }),
    // Poll every 2 seconds for a smooth typing indicator experience.
    refetchInterval: 2000,
    // Disable polling when the browser tab is not in focus to save resources.
    refetchIntervalInBackground: false,
    // Allow dynamically enabling/disabling the query.
    enabled: enabled,
  });
};