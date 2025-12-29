import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Chats } from "../../helpers/schema";

export const schema = z.object({
  merchantEmail: z.string().email(),
  shopName: z.string().optional().nullable(),
  shopDomain: z.string().optional().nullable(),
  errorContext: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Chats>;

export const postChatCreate = async (body: InputType, init?: RequestInit, apiBaseUrl?: string): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const baseUrl = apiBaseUrl || '';
  const result = await fetch(`${baseUrl}/_api/chat/create`, {
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