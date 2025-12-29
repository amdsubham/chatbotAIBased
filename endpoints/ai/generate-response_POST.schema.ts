import { z } from "zod";
import superjson from 'superjson';
import { MessageSenderArrayValues } from "../../helpers/schema";

export const schema = z.object({
  chatId: z.number().int().positive(),
  userMessage: z.string().min(1),
  userImageUrl: z.string().optional().nullable(),
  errorContext: z.string().optional().nullable(),
  previousMessages: z.array(z.object({
    sender: z.enum(MessageSenderArrayValues),
    content: z.string(),
    imageUrl: z.string().optional().nullable(),
  })).optional(),
});

export type InputType = z.infer<typeof schema>;

// Output is a stream, so we don't define a specific OutputType here.
// The client will handle the ReadableStream.

export const postAiGenerateResponse = async (body: InputType, init?: RequestInit): Promise<ReadableStream<Uint8Array> | null> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/ai/generate-response`, {
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

  return result.body;
};