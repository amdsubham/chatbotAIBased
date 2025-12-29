import { z } from "zod";
import superjson from 'superjson';

export const ExportFormatArray = ["pdf", "json", "txt"] as const;
export const ExportFormatEnum = z.enum(ExportFormatArray);
export type ExportFormat = z.infer<typeof ExportFormatEnum>;

export const schema = z.object({
  chatId: z.number().int().positive(),
  format: ExportFormatEnum,
});

export type InputType = z.infer<typeof schema>;

// Output is a file blob, so we don't define a specific OutputType for superjson parsing.
// The client will handle the raw Response.

export const postChatExport = async (body: InputType, init?: RequestInit): Promise<Response> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/chat/export`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    // Try to parse error as JSON, but fallback to text
    try {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    } catch (e) {
        throw new Error(`Failed to export chat. Status: ${result.status}`);
    }
  }
  
  // Return the raw response for the client to handle as a blob
  return result;
};