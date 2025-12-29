import { z } from "zod";
import superjson from 'superjson';

export const schema = z.union([
  z.object({
    chatId: z.number().int().positive(),
  }),
  z.object({
    chatIds: z.array(z.number().int().positive()).min(1),
  }),
]);

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
  deletedChatIds: number[];
};

export const postChatDelete = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
    const result = await fetch(`/_api/chat/delete`, {
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
      errorMessage = result.statusText || "Failed to delete chat";
    }
    throw new Error(errorMessage);
  }
  
  return superjson.parse<OutputType>(text);
};