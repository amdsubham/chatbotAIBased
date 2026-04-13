import React, { useState, useEffect } from "react";
import { ListTodo } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { toast } from "sonner";
import styles from "./CreateTaskDialog.module.css";

const MAIN_APP_API = "https://auspost-all-in-one.fly.dev";

type Priority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "todo" | "in_progress";
type AddTo = "sprint" | "backlog";

interface Sprint {
  id: string;
  name: string;
  status: string;
}

export interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTitle?: string;
  defaultDescription?: string;
  merchantName?: string;
  merchantEmail?: string;
}

export const CreateTaskDialog = ({
  open,
  onOpenChange,
  defaultTitle = "",
  defaultDescription = "",
  merchantName = "",
  merchantEmail = "",
}: CreateTaskDialogProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [merchant, setMerchant] = useState(merchantName);
  const [priority, setPriority] = useState<Priority>("high");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [addTo, setAddTo] = useState<AddTo>("sprint");
  const [saving, setSaving] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setMerchant(
        merchantName
          ? `${merchantName}${merchantEmail ? ` (${merchantEmail})` : ""}`
          : merchantEmail || ""
      );
      setPriority("high");
      setStatus("todo");
      setAddTo("sprint");
      // Fetch sprints
      fetch(`${MAIN_APP_API}/api/admin/sprints`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setSprints(json.data || []);
        })
        .catch(() => {});
    }
  }, [open, defaultTitle, defaultDescription, merchantName, merchantEmail]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Task name is required");
      return;
    }

    const activeSprint = sprints.find((s) => s.status === "active");
    const backlogSprint = sprints.find((s) => s.status === "backlog");
    const targetSprint = addTo === "backlog" ? backlogSprint : activeSprint;

    if (!targetSprint) {
      toast.error("No sprint available. Please try again.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${MAIN_APP_API}/api/admin/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          merchant: merchant.trim(),
          sprintId: targetSprint.id,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      toast.success(`Task added to ${addTo === "backlog" ? "Backlog" : "this week's sprint"}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle className={styles.dialogTitle}>
            <ListTodo size={20} /> Create Task
          </DialogTitle>
          <DialogDescription>
            Add a task to the admin task list
          </DialogDescription>
        </DialogHeader>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Task Name</label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Merchant</label>
            <Input
              placeholder="Merchant name (optional)"
              value={merchant}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMerchant(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <Textarea
              placeholder="Add details..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Add To</label>
              <Select value={addTo} onValueChange={(v: string) => setAddTo(v as AddTo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sprint">This Week</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <Select value={priority} onValueChange={(v: string) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <Select value={status} onValueChange={(v: string) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Adding..." : "Add to Tasks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
