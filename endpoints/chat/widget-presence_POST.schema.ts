import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Chats } from "../../helpers/schema";

export const schema = z.object({
  chatId: z.number().int().positive(),
  isOpen: z.boolean(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Chats>;

export const postChatWidgetPresence = async (body: InputType, apiBaseUrl?: string, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const baseUrl = apiBaseUrl || '';
    const result = await fetch(`${baseUrl}/_api/chat/widget-presence`, {
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
      throw new Error(`Failed to update widget presence: ${result.statusText}`);
    }
  }
  
  return superjson.parse<OutputType>(text);
};