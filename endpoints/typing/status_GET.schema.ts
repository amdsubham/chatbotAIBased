import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { TypingStatus } from "../../helpers/schema";

export const schema = z.object({
  chatId: z.coerce.number().int().positive(),
  expirationSeconds: z.coerce.number().int().positive().optional().default(5),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Pick<Selectable<TypingStatus>, 'typerType' | 'lastTypingAt'>[];

export const getTypingStatus = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams({
    chatId: params.chatId.toString(),
  });
  if (params.expirationSeconds) {
    queryParams.set('expirationSeconds', params.expirationSeconds.toString());
  }
  
  const result = await fetch(`/_api/typing/status?${queryParams.toString()}`, {
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