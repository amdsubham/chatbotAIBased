import { db } from "../../helpers/db";
import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newShortcut = await db.insertInto('shortcutMessages')
      .values({
        name: input.name,
        message: input.message,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(newShortcut satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    console.error("Error creating shortcut message:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}