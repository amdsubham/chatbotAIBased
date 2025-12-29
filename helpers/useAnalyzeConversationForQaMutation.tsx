import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { postAiAnalyzeConversationForQa, InputType, OutputType } from "../endpoints/ai/analyze-conversation-for-qa_POST.schema";

export const useAnalyzeConversationForQaMutation = () => {
  return useMutation<OutputType, Error, InputType>({
    mutationFn: (data: InputType) => postAiAnalyzeConversationForQa(data),
    onMutate: () => {
      toast.loading("AI is analyzing the conversation...", {
        id: "analyze-qa",
      });
    },
    onSuccess: () => {
      toast.success("Analysis complete. Q&A suggested.", {
        id: "analyze-qa",
      });
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`, {
        id: "analyze-qa",
      });
    },
  });
};