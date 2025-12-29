import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  messageId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
  deletedMessageId: number;
};

export const postMessageDelete = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/message/delete`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    let errorMessage: string;
    try {
      const errorObject = superjson.parse<{ error: string }>(text);
      errorMessage = errorObject.error;
    } catch (e) {
      errorMessage = result.statusText || "Failed to delete message";
    }
    throw new Error(errorMessage);
  }
  
  return superjson.parse<OutputType>(text);
};