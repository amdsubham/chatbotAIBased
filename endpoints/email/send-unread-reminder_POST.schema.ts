import { z } from "zod";
import superjson from 'superjson';

// No input needed - this is a cron-like check
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  emailsSent: number;
  message: string;
};

export const postEmailSendUnreadReminder = async (body: InputType = {}, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/email/send-unread-reminder`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(responseText);
    throw new Error(errorObject.error);
  }
  
  return superjson.parse<OutputType>(responseText);
};