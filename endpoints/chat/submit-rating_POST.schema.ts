import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Chats } from "../../helpers/schema";

export const schema = z.object({
  chatId: z.number().int().positive(),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  feedbackText: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: true;
  message: string;
  chat: Selectable<Chats>;
};

export const postChatSubmitRating = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/api/chat/submit-rating`, {
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
    try {
      const errorObject = superjson.parse<{ error: string }>(text);
      throw new Error(errorObject.error);
    } catch (e) {
      throw new Error(`Failed to submit rating: ${result.statusText}`);
    }
  }
  
  return superjson.parse<OutputType>(text);
};