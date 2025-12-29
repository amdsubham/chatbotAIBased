import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { ShortcutMessages } from "../../helpers/schema";

export const schema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Name is required."),
  message: z.string().min(1, "Message is required."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<ShortcutMessages>;

export const postShortcutMessagesUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/shortcut-messages/update`, {
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