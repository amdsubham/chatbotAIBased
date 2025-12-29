import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { RefreshCw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from './Dialog';
import { Button } from './Button';
import { Form, FormControl, FormItem, FormLabel, FormMessage, useForm } from './Form';
import { Textarea } from './Textarea';
import { useAnalyzeConversationForQaMutation } from '../helpers/useAnalyzeConversationForQaMutation';
import { useCreateKnowledgeBaseMutation } from '../helpers/useCreateKnowledgeBaseMutation';
import styles from './AddQAFromChatDialog.module.css';

interface AddQAFromChatDialogProps {
  chatId: number;
  onSuccess?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const formSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty.'),
  answer: z.string().min(1, 'Answer cannot be empty.'),
});

export const AddQAFromChatDialog: React.FC<AddQAFromChatDialogProps> = ({
  chatId,
  onSuccess,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    schema: formSchema,
    defaultValues: {
      question: '',
      answer: '',
    },
  });

  const analyzeMutation = useAnalyzeConversationForQaMutation();
  const createKbMutation = useCreateKnowledgeBaseMutation();

  useEffect(() => {
    if (analyzeMutation.data) {
      form.setValues({
        question: analyzeMutation.data.question,
        answer: analyzeMutation.data.answer,
      });
    }
  }, [analyzeMutation.data, form.setValues]);

  const handleAnalyze = () => {
    analyzeMutation.mutate({ chatId });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createKbMutation.mutate(values, {
      onSuccess: () => {
        onSuccess?.();
        setIsOpen(false);
        form.setValues({ question: '', answer: '' }); // Reset form
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      analyzeMutation.reset();
      createKbMutation.reset();
      form.setValues({ question: '', answer: '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild className={className}>
        {children ?? <Button variant="outline">Add to Knowledge Base</Button>}
      </DialogTrigger>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Add to Knowledge Base</DialogTitle>
          <DialogDescription>
            Use AI to analyze this conversation and generate a Q&A entry, then edit and save it.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.analyzeContainer}>
          <Button
            variant="secondary"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? (
              <Loader2 className={styles.spinner} />
            ) : (
              <RefreshCw size={16} />
            )}
            Analyze Conversation
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
            <FormItem name="question">
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="AI-suggested question will appear here..."
                  value={form.values.question}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, question: e.target.value }))}
                  rows={3}
                  disabled={createKbMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="answer">
              <FormLabel>Answer</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="AI-suggested answer will appear here..."
                  value={form.values.answer}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, answer: e.target.value }))}
                  rows={6}
                  disabled={createKbMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={createKbMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={createKbMutation.isPending}>
                {createKbMutation.isPending && <Loader2 className={styles.spinner} />}
                Save to Knowledge Base
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};