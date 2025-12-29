import { schema, OutputType } from "./register_POST.schema";
import { db } from "../../helpers/db";
import { hash } from "bcryptjs";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, password, displayName, role = "admin" } = schema.parse(json);

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    const result = await db.transaction().execute(async (trx) => {
      // Check if user already exists
      const existingUser = await trx
        .selectFrom("users")
        .select(["id"])
        .where(sql`LOWER(email)`, "=", normalizedEmail)
        .limit(1)
        .execute();

      if (existingUser.length > 0) {
        throw new Error("User with this email already exists");
      }

      // Hash the password
      const passwordHash = await hash(password, 10);

      // Create user
      const [user] = await trx
        .insertInto("users")
        .values({
          email: normalizedEmail,
          displayName: displayName || normalizedEmail.split("@")[0],
          role: role,
          createdAt: new Date(),
        })
        .returning(["id", "email", "displayName", "role", "avatarUrl"])
        .execute();

      // Insert password
      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash: passwordHash,
        })
        .execute();

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl || null,
          role: user.role,
        },
        message: "User registered successfully",
      };
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    return new Response(
      JSON.stringify({ message: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

