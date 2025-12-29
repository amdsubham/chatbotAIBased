import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { useCreateChatMutation } from '../helpers/useCreateChatMutation';
import { schema as createChatSchema } from '../endpoints/chat/create_POST.schema';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import styles from './NewChatForm.module.css';

type NewChatFormValues = z.infer<typeof createChatSchema>;

export interface NewChatFormProps {
  onChatCreated: (chatId: number) => void;
  isCreating: boolean;
  initialErrorContext?: string;
  autoOpened?: boolean;
  initialValues?: Partial<Pick<NewChatFormValues, 'merchantEmail' | 'shopName' | 'shopDomain'>>;
}

export const NewChatForm = ({
  onChatCreated,
  isCreating,
  initialErrorContext,
  autoOpened = false,
  initialValues,
}: NewChatFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewChatFormValues>({
    resolver: zodResolver(createChatSchema),
    defaultValues: {
      merchantEmail: initialValues?.merchantEmail || '',
      shopName: initialValues?.shopName || '',
      shopDomain: initialValues?.shopDomain || '',
      errorContext: initialErrorContext || '',
    },
  });
  const createChatMutation = useCreateChatMutation();

  const onSubmit: SubmitHandler<NewChatFormValues> = async (data) => {
    try {
      const newChat = await createChatMutation.mutateAsync(data);
      onChatCreated(newChat.id);
    } catch (error) {
      console.error('Failed to create chat:', error);
      // Optionally, handle and display this error to the user
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {autoOpened && (
        <div className={styles.autoOpenBadge}>
          <AlertCircle size={16} />
          <span>Auto-opened due to detected error</span>
        </div>
      )}
      <div className={styles.formField}>
        <label htmlFor="merchantEmail">Email</label>
        <Input
          id="merchantEmail"
          type="email"
          placeholder="you@example.com"
          {...register('merchantEmail')}
          disabled={isCreating}
        />
        {errors.merchantEmail && (
          <p className={styles.errorText}>{errors.merchantEmail.message}</p>
        )}
      </div>
      <div className={styles.formField}>
        <label htmlFor="shopName">Shop Name (Optional)</label>
        <Input
          id="shopName"
          placeholder="My Awesome Store"
          {...register('shopName')}
          disabled={isCreating}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="shopDomain">Shop Domain (Optional)</label>
        <Input
          id="shopDomain"
          placeholder="mystore.com"
          {...register('shopDomain')}
          disabled={isCreating}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="errorContext">How can we help?</label>
        <Textarea
          id="errorContext"
          placeholder="Describe the issue you're facing..."
          rows={4}
          {...register('errorContext')}
          disabled={isCreating}
        />
      </div>
      <Button type="submit" disabled={isCreating} className={styles.submitButton}>
        {isCreating ? 'Starting Chat...' : 'Start Chat'}
      </Button>
    </form>
  );
};