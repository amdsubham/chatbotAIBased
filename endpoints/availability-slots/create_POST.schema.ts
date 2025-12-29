import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { AvailabilitySlots } from "../../helpers/schema";

const timeFormatRegex = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export const schema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeFormatRegex, "Invalid time format. Use HH:MM or HH:MM:SS"),
  endTime: z.string().regex(timeFormatRegex, "Invalid time format. Use HH:MM or HH:MM:SS"),
  timezone: z.string().min(1),
  enabled: z.boolean(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<AvailabilitySlots>;

export const postAvailabilitySlotsCreate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/availability-slots/create`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};