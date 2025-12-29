import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Messages, MessageSenderArrayValues } from "../../helpers/schema";

export const schema = z.object({
  chatId: z.number().int().positive(),
  sender: z.enum(MessageSenderArrayValues),
  content: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Messages>;

export const postMessageSend = async (body: InputType, init?: RequestInit, apiBaseUrl?: string): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const baseUrl = apiBaseUrl || '';
  const result = await fetch(`${baseUrl}/_api/message/send`, {
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