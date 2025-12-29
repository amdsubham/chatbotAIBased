import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postKnowledgeBaseDelete, InputType as DeleteKBInput } from "../endpoints/knowledge-base/delete_POST.schema";

export const useDeleteKnowledgeBaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteKBInput) => postKnowledgeBaseDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
  });
};