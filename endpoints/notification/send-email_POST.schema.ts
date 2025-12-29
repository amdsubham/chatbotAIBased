import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  chatId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
};

export const postNotificationSendEmail = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/notification/send-email`, {
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