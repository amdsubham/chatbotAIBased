import React, { useState, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAvailabilitySlotsQuery } from "../helpers/useAvailabilitySlotsQuery";
import { useCreateAvailabilitySlotMutation } from "../helpers/useCreateAvailabilitySlotMutation";
import { useUpdateAvailabilitySlotMutation } from "../helpers/useUpdateAvailabilitySlotMutation";
import { useDeleteAvailabilitySlotMutation } from "../helpers/useDeleteAvailabilitySlotMutation";
import { Button } from "./Button";
import { Input } from "./Input";
import { Skeleton } from "./Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./Dialog";
import { Switch } from "./Switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Badge } from "./Badge";
import { Plus, Edit, Trash2, Clock, Globe, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import styles from "./AvailabilityManager.module.css";
import { Selectable } from "kysely";
import { AvailabilitySlots } from "../helpers/schema";

const timeFormatRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const formSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(timeFormatRegex, "Invalid time format. Use HH:MM"),
  endTime: z.string().regex(timeFormatRegex, "Invalid time format. Use HH:MM"),
  timezone: z.string().min(1, "Timezone is required."),
  enabled: z.boolean(),
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type FormData = z.infer<typeof formSchema>;
type AvailabilitySlot = Selectable<AvailabilitySlots>;

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Pacific/Auckland",
];

export const AvailabilityManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);

  const { data: slots, isFetching, error } = useAvailabilitySlotsQuery();
  const createMutation = useCreateAvailabilitySlotMutation();
  const updateMutation = useUpdateAvailabilitySlotMutation();
  const deleteMutation = useDeleteAvailabilitySlotMutation();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      timezone: "UTC",
      enabled: true,
    },
  });

  const openModal = (slot: AvailabilitySlot | null = null) => {
    setEditingSlot(slot);
    if (slot) {
      reset({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime.substring(0, 5),
        endTime: slot.endTime.substring(0, 5),
        timezone: slot.timezone,
        enabled: slot.enabled,
      });
    } else {
      reset({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
        enabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (editingSlot) {
      updateMutation.mutate({ id: editingSlot.id, ...data }, {
        onSuccess: () => {
          toast.success("Time slot updated successfully.");
          closeModal();
        },
        onError: (e) => {
          if (e instanceof Error) toast.error(`Failed to update: ${e.message}`);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Time slot added successfully.");
          closeModal();
        },
        onError: (e) => {
          if (e instanceof Error) toast.error(`Failed to add: ${e.message}`);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this time slot?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => toast.success("Time slot deleted."),
        onError: (e) => {
          if (e instanceof Error) toast.error(`Failed to delete: ${e.message}`);
        }
      });
    }
  };

  const handleToggle = (slot: AvailabilitySlot) => {
    updateMutation.mutate({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timezone: slot.timezone,
      enabled: !slot.enabled,
    }, {
      onSuccess: () => toast.success(`Slot ${!slot.enabled ? 'enabled' : 'disabled'}.`),
      onError: (e) => {
        if (e instanceof Error) toast.error(`Failed to update: ${e.message}`);
      }
    });
  };

  const groupedSlots = useMemo(() => {
    if (!slots) return {};
    return slots.reduce((acc, slot) => {
      (acc[slot.dayOfWeek] = acc[slot.dayOfWeek] || []).push(slot);
      // Sort slots by start time
      acc[slot.dayOfWeek].sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {} as Record<number, AvailabilitySlot[]>);
  }, [slots]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Availability Schedule</h2>
        <Button onClick={() => openModal()}>
          <Plus size={16} /> Add Time Slot
        </Button>
      </div>

      <div className={styles.list}>
        {isFetching ? (
          Array.from({ length: 3 }).map((_, i) => <SlotSkeleton key={i} />)
        ) : error ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <p>Error loading availability schedule.</p>
            <p className={styles.errorMessage}>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
          </div>
        ) : !slots || slots.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={48} />
            <p>No availability slots defined.</p>
            <Button onClick={() => openModal()}>Add your first time slot</Button>
          </div>
        ) : (
          DAYS_OF_WEEK.map((day, index) => (
            groupedSlots[index] && (
              <div key={index} className={styles.dayGroup}>
                <h3 className={styles.dayHeader}>
                  <Badge variant="secondary">{day}</Badge>
                </h3>
                {groupedSlots[index].map((slot) => (
                  <div key={slot.id} className={`${styles.slotItem} ${!slot.enabled ? styles.disabled : ''}`}>
                    <div className={styles.slotDetails}>
                      <div className={styles.timeRange}>
                        <Clock size={14} />
                        <span>{slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</span>
                      </div>
                      <div className={styles.timezone}>
                        <Globe size={14} />
                        <span>{slot.timezone}</span>
                      </div>
                    </div>
                    <div className={styles.slotActions}>
                      <Switch
                        checked={slot.enabled}
                        onCheckedChange={() => handleToggle(slot)}
                        disabled={updateMutation.isPending}
                        aria-label={slot.enabled ? 'Disable slot' : 'Enable slot'}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openModal(slot)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(slot.id)} disabled={deleteMutation.isPending}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )).filter(Boolean)
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit" : "Add"} Time Slot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formField}>
              <label htmlFor="dayOfWeek">Day of Week</label>
              <Controller
                name="dayOfWeek"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                    <SelectTrigger id="dayOfWeek">
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <SelectItem key={index} value={String(index)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.dayOfWeek && <p className={styles.error}>{errors.dayOfWeek.message}</p>}
            </div>

            <div className={styles.timeFields}>
              <div className={styles.formField}>
                <label htmlFor="startTime">Start Time</label>
                <Input id="startTime" type="time" {...register("startTime")} />
                {errors.startTime && <p className={styles.error}>{errors.startTime.message}</p>}
              </div>
              <div className={styles.formField}>
                <label htmlFor="endTime">End Time</label>
                <Input id="endTime" type="time" {...register("endTime")} />
                {errors.endTime && <p className={styles.error}>{errors.endTime.message}</p>}
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="timezone">Timezone</label>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.timezone && <p className={styles.error}>{errors.timezone.message}</p>}
            </div>

            <div className={styles.switchField}>
              <label htmlFor="enabled">Enabled</label>
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
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

// Need to import Controller from react-hook-form for Select and Switch
import { Controller } from "react-hook-form";

const SlotSkeleton = () => (
  <div className={styles.dayGroup}>
    <Skeleton style={{ height: '1.5rem', width: '100px', marginBottom: 'var(--spacing-3)' }} />
    <div className={styles.slotItem}>
      <div className={styles.slotDetails}>
        <Skeleton style={{ height: '1.25rem', width: '120px' }} />
        <Skeleton style={{ height: '1.25rem', width: '150px' }} />
      </div>
      <div className={styles.slotActions}>
        <Skeleton style={{ height: '24px', width: '42px' }} />
        <Skeleton style={{ height: '32px', width: '32px', borderRadius: 'var(--radius-sm)' }} />
        <Skeleton style={{ height: '32px', width: '32px', borderRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  </div>
);