import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postKnowledgeBaseUpdate, InputType as UpdateKBInput } from "../endpoints/knowledge-base/update_POST.schema";

export const useUpdateKnowledgeBaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateKBInput) => postKnowledgeBaseUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
  });
};