import React, { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { useCreateKnowledgeBaseMutation } from "../helpers/useCreateKnowledgeBaseMutation";
import { toast } from "sonner";
import styles from "./SaveToKnowledgeBaseDialog.module.css";

export interface SaveToKnowledgeBaseDialogProps {
  question: string;
  answer: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SaveToKnowledgeBaseDialog = ({
  question: initialQuestion,
  answer: initialAnswer,
  open,
  onOpenChange,
}: SaveToKnowledgeBaseDialogProps) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState(initialAnswer);
  const createKnowledgeMutation = useCreateKnowledgeBaseMutation();

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setQuestion(initialQuestion);
      setAnswer(initialAnswer);
    }
  }, [open, initialQuestion, initialAnswer]);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Both question and answer are required");
      return;
    }

    try {
      await createKnowledgeMutation.mutateAsync({
        question: question.trim(),
        answer: answer.trim(),
      });
      toast.success("Q&A saved to knowledge base");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save to knowledge base");
      console.error("Error saving to knowledge base:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Save to Knowledge Base</DialogTitle>
          <DialogDescription>
            Review and edit the Q&A pair before saving to the knowledge base.
          </DialogDescription>
        </DialogHeader>
        <div className={styles.formContent}>
          <div className={styles.fieldGroup}>
            <label htmlFor="question" className={styles.label}>
              Question
            </label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the question..."
              rows={3}
              disabled={createKnowledgeMutation.isPending}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="answer" className={styles.label}>
              Answer
            </label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer..."
              rows={5}
              disabled={createKnowledgeMutation.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createKnowledgeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              createKnowledgeMutation.isPending ||
              !question.trim() ||
              !answer.trim()
            }
          >
            {createKnowledgeMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <BookmarkPlus size={16} />
                Save to Knowledge Base
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};