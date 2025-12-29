import { z } from "zod";
import { User } from "../../helpers/User";

export const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  role: z.enum(["admin", "user"]).default("admin"),
});

export type OutputType = {
  user: User;
  message: string;
};

export const postRegister = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/register`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Registration failed");
  }

  return result.json();
};

