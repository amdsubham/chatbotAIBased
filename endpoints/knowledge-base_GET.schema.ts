import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { KnowledgeBase } from "../helpers/schema";

export const schema = z.object({
  search: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<KnowledgeBase>[];

export const getKnowledgeBase = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.search) {
    queryParams.set('search', params.search);
  }
  
  const result = await fetch(`/_api/knowledge-base?${queryParams.toString()}`, {
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