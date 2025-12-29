import { db } from "../../helpers/db";
import { schema, OutputType } from "./delete_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const result = await db.deleteFrom('shortcutMessages')
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (result.numDeletedRows === 0n) {
      return new Response(superjson.stringify({ error: "Shortcut message not found" }), { status: 404 });
    }

    return new Response(superjson.stringify({ success: true } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting shortcut message:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}