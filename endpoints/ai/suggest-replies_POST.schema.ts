import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  chatId: z.number().int().positive(),
  draftMessage: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = 
  | {
      suggestions: string[];
    }
  | {
      error: true;
      message: string;
      retryable: boolean;
    };

export const postAiSuggestReplies = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/ai/suggest-replies`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseData = superjson.parse<OutputType>(await result.text());
  
    if (!result.ok) {
    // Server returned an error status code
    if ('error' in responseData) {
      // Structured error response
      throw new Error(responseData.message);
    }
    // Fallback for old-style error responses
    const errorObject = responseData as unknown as { error: string };
    throw new Error(errorObject.error);
  }

  return responseData;
};