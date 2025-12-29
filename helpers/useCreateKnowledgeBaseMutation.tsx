import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postKnowledgeBaseCreate, InputType as CreateKBInput } from "../endpoints/knowledge-base/create_POST.schema";

export const useCreateKnowledgeBaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateKBInput) => postKnowledgeBaseCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
  });
};