import { useQuery } from "@tanstack/react-query";
import { getKnowledgeBase, InputType as GetKnowledgeBaseInput } from "../endpoints/knowledge-base_GET.schema";

export const useKnowledgeBaseQuery = (params?: GetKnowledgeBaseInput) => {
  return useQuery({
    queryKey: ["knowledge-base", params],
    queryFn: () => getKnowledgeBase(params),
  });
};