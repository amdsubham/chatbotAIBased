import { useMutation } from "@tanstack/react-query";
import { postAiSuggestReplies, InputType, OutputType } from "../endpoints/ai/suggest-replies_POST.schema";

/**
 * A React Query mutation hook for generating AI-powered reply suggestions for a chat.
 * This is an on-demand action and does not invalidate any queries upon completion.
 *
 * @returns A mutation object from TanStack Query.
 * - `mutate(variables: { chatId: number; draftMessage?: string })`: Function to trigger the mutation.
 *   - Can be called as `mutate({ chatId: 123 })` for generating new suggestions
 *   - Or as `mutate({ chatId: 123, draftMessage: "some text" })` for improving a draft
 * - `data`: The successful response from the endpoint (`OutputType`).
 * - `isPending`: True while the mutation is in flight.
 * - `isError`: True if the mutation resulted in an error.
 * - `error`: The error object.
 */
export const useAiSuggestRepliesMutation = () => {
  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postAiSuggestReplies(variables),
  });
};