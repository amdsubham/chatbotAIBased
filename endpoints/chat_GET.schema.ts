import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Chats, Messages } from "../helpers/schema";

export const schema = z.object({
  chatId: z.coerce.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Chats> & {
  messages: Selectable<Messages>[];
};

export const getChat = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams({
    chatId: params.chatId.toString(),
  });
  
  const result = await fetch(`/_api/chat?${queryParams.toString()}`, {
    method: "GET",
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