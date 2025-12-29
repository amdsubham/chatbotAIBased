import { useMutation } from "@tanstack/react-query";
import { postTypingUpdate, InputType as UpdateTypingInput } from "../endpoints/typing/update_POST.schema";

/**
 * A React Query mutation hook for updating the typing status of a user or admin.
 * It wraps the `postTypingUpdate` API client function.
 *
 * No cache invalidation is performed on success, as the typing status is
 * expected to be polled by a separate query.
 *
 * @returns The mutation object from `useMutation`.
 */
export const useUpdateTypingMutation = () => {
  return useMutation({
    mutationFn: (data: UpdateTypingInput) => postTypingUpdate(data),
  });
};