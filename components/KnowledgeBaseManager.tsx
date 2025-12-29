import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useKnowledgeBaseQuery } from "../helpers/useKnowledgeBaseQuery";
import { useCreateKnowledgeBaseMutation } from "../helpers/useCreateKnowledgeBaseMutation";
import { useUpdateKnowledgeBaseMutation } from "../helpers/useUpdateKnowledgeBaseMutation";
import { useDeleteKnowledgeBaseMutation } from "../helpers/useDeleteKnowledgeBaseMutation";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Skeleton } from "./Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./Dialog";
import { Plus, Edit, Trash2, Search, BookOpen } from "lucide-react";
import styles from "./KnowledgeBaseManager.module.css";
import { Selectable } from "kysely";
import { KnowledgeBase } from "../helpers/schema";

const formSchema = z.object({
  question: z.string().min(1, "Question is required."),
  answer: z.string().min(1, "Answer is required."),
});

type FormData = z.infer<typeof formSchema>;
type KnowledgeBaseItem = Selectable<KnowledgeBase>;

export const KnowledgeBaseManager = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null);

  const { data: kbItems, isFetching, error } = useKnowledgeBaseQuery({ search: search || undefined });
  const createMutation = useCreateKnowledgeBaseMutation();
  const updateMutation = useUpdateKnowledgeBaseMutation();
  const deleteMutation = useDeleteKnowledgeBaseMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const openModal = (item: KnowledgeBaseItem | null = null) => {
    setEditingItem(item);
    reset(item ? { question: item.question, answer: item.answer } : { question: "", answer: "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset({ question: "", answer: "" });
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data }, { onSuccess: closeModal });
    } else {
      createMutation.mutate(data, { onSuccess: closeModal });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={16} /> Add New Q&A
        </Button>
      </div>

      <div className={styles.list}>
        {isFetching ? (
          Array.from({ length: 3 }).map((_, i) => <KBItemSkeleton key={i} />)
        ) : error ? (
          <div className={styles.emptyState}>Error loading knowledge base.</div>
        ) : !kbItems || kbItems.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} />
            <p>No knowledge base items found.</p>
            <Button onClick={() => openModal()}>Add your first Q&A</Button>
          </div>
        ) : (
          kbItems.map((item) => (
            <div key={item.id} className={styles.kbItem}>
              <div className={styles.itemContent}>
                <h4 className={styles.question}>{item.question}</h4>
                <p className={styles.answer}>{item.answer}</p>
                <span className={styles.timestamp}>
                  Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.itemActions}>
                <Button variant="ghost" size="icon" onClick={() => openModal(item)}>
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={deleteMutation.isPending}>
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
            <DialogTitle>{editingItem ? "Edit" : "Add"} Q&A</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formField}>
              <label htmlFor="question">Question</label>
              <Textarea id="question" {...register("question")} rows={3} />
              {errors.question && <p className={styles.error}>{errors.question.message}</p>}
            </div>
            <div className={styles.formField}>
              <label htmlFor="answer">Answer</label>
              <Textarea id="answer" {...register("answer")} rows={5} />
              {errors.answer && <p className={styles.error}>{errors.answer.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const KBItemSkeleton = () => (
  <div className={styles.kbItem}>
    <div className={styles.itemContent}>
      <Skeleton style={{ height: '1.25rem', width: '80%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '90%' }} />
      <Skeleton style={{ height: '1rem', width: '70%', marginTop: 'var(--spacing-1)' }} />
      <Skeleton style={{ height: '0.75rem', width: '40%', marginTop: 'var(--spacing-4)' }} />
    </div>
  </div>
);