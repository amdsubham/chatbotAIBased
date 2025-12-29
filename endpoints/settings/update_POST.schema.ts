import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Settings } from "../../helpers/schema";

export const schema = z.object({
  autoAiResponseEnabled: z.boolean().optional(),
  aiAgentName: z.string().min(1, "AI agent name cannot be empty").max(100, "AI agent name too long").optional(),
  adminAgentName: z.string().min(1, "Admin agent name cannot be empty").max(100, "Admin agent name too long").optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Settings>;

export const postSettingsUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/settings/update`, {
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