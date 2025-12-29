import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShortcutMessagesQuery } from "../helpers/useShortcutMessagesQuery";
import { useCreateShortcutMessageMutation } from "../helpers/useCreateShortcutMessageMutation";
import { useUpdateShortcutMessageMutation } from "../helpers/useUpdateShortcutMessageMutation";
import { useDeleteShortcutMessageMutation } from "../helpers/useDeleteShortcutMessageMutation";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Skeleton } from "./Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./Dialog";
import { Plus, Edit, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import styles from "./ShortcutMessagesManager.module.css";
import { Selectable } from "kysely";
import { ShortcutMessages } from "../helpers/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  message: z.string().min(1, "Message is required."),
});

type FormData = z.infer<typeof formSchema>;
type ShortcutMessage = Selectable<ShortcutMessages>;

export const ShortcutMessagesManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<ShortcutMessage | null>(null);

  const { data: shortcuts, isFetching, error } = useShortcutMessagesQuery();
  const createMutation = useCreateShortcutMessageMutation();
  const updateMutation = useUpdateShortcutMessageMutation();
  const deleteMutation = useDeleteShortcutMessageMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const openModal = (shortcut: ShortcutMessage | null = null) => {
    setEditingShortcut(shortcut);
    if (shortcut) {
      reset({ name: shortcut.name, message: shortcut.message });
    } else {
      reset({ name: "", message: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShortcut(null);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (editingShortcut) {
      updateMutation.mutate({ id: editingShortcut.id, ...data }, {
        onSuccess: () => {
          toast.success("Shortcut updated successfully.");
          closeModal();
        },
        onError: (e) => {
          if (e instanceof Error) toast.error(`Failed to update: ${e.message}`);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Shortcut added successfully.");
          closeModal();
        },
        onError: (e) => {
          if (e instanceof Error) toast.error(`Failed to add: ${e.message}`);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this shortcut?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => toast.success("Shortcut deleted."),
        onError: (e) => {
          if (e instanceof Error) toast.error(`Failed to delete: ${e.message}`);
        }
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Shortcut Messages</h2>
        <Button onClick={() => openModal()}>
          <Plus size={16} /> Add Shortcut
        </Button>
      </div>

      <div className={styles.list}>
        {isFetching ? (
          Array.from({ length: 3 }).map((_, i) => <ShortcutSkeleton key={i} />)
        ) : error ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <p>Error loading shortcut messages.</p>
            <p className={styles.errorMessage}>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
          </div>
        ) : !shortcuts || shortcuts.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} />
            <p>No shortcut messages defined.</p>
            <Button onClick={() => openModal()}>Add your first shortcut</Button>
          </div>
        ) : (
          shortcuts.map((shortcut) => (
            <div key={shortcut.id} className={styles.shortcutItem}>
              <div className={styles.shortcutDetails}>
                <strong className={styles.shortcutName}>{shortcut.name}</strong>
                <p className={styles.shortcutMessage}>{shortcut.message}</p>
              </div>
              <div className={styles.shortcutActions}>
                <Button variant="ghost" size="icon" onClick={() => openModal(shortcut)}>
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(shortcut.id)} disabled={deleteMutation.isPending}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShortcut ? "Edit" : "Add"} Shortcut Message</DialogTitle>
            <DialogDescription>
              Create quick replies that can be used by agents during chats.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formField}>
              <label htmlFor="name">Name</label>
              <Input id="name" placeholder="e.g., Greeting" {...register("name")} />
              {errors.name && <p className={styles.error}>{errors.name.message}</p>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="message">Message</label>
              <Textarea id="message" placeholder="e.g., Hello! How can I help you today?" {...register("message")} />
              {errors.message && <p className={styles.error}>{errors.message.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Save Shortcut
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ShortcutSkeleton = () => (
  <div className={styles.shortcutItem}>
    <div className={styles.shortcutDetails}>
      <Skeleton style={{ height: '1.25rem', width: '120px', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '250px' }} />
    </div>
    <div className={styles.shortcutActions}>
      <Skeleton style={{ height: '32px', width: '32px', borderRadius: 'var(--radius-sm)' }} />
      <Skeleton style={{ height: '32px', width: '32px', borderRadius: 'var(--radius-sm)' }} />
    </div>
  </div>
);