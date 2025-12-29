import { useMutation } from "@tanstack/react-query";
import { postAiGenerateResponse, InputType as AiGenerateResponseInput } from "../endpoints/ai/generate-response_POST.schema";

export const useAiGenerateResponseMutation = () => {
  return useMutation({
    mutationFn: (data: AiGenerateResponseInput) => postAiGenerateResponse(data),
    onError: (error) => {
      console.error("Error generating AI response:", error);
      // Optionally, you can show a toast notification here
    }
  });
};