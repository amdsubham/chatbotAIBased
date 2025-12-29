import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { postChatExport, InputType as ChatExportInput } from "../endpoints/chat/export_POST.schema";

const mimeTypes: Record<ChatExportInput['format'], string> = {
  pdf: 'application/pdf',
  json: 'application/json',
  txt: 'text/plain',
};

export const useChatExportMutation = () => {
  return useMutation({
    mutationFn: postChatExport,
    onSuccess: async (response, variables) => {
      try {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `chat-transcript-${variables.chatId}.${variables.format}`;
        document.body.appendChild(a);
        a.click();
        // Delay revoking the object URL so the browser has time to start the download
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();
        }, 100);
        toast.success("Chat transcript downloaded successfully.");
      } catch (error) {
        console.error("Failed to process download:", error);
        toast.error("Failed to process download. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Chat export failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during export.";
      toast.error(`Export failed: ${errorMessage}`);
    },
  });
};