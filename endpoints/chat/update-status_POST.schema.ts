import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Chats, ChatStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  chatId: z.number().int().positive(),
  status: z.enum(ChatStatusArrayValues),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Chats>;

export const postChatUpdateStatus = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
    const result = await fetch(`/_api/chat/update-status`, {
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
      errorMessage = result.statusText || "Failed to update chat status";
    }
    throw new Error(errorMessage);
  }
  
  return superjson.parse<OutputType>(text);
};