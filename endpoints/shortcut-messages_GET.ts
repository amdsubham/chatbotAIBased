import { db } from "../helpers/db";
import { OutputType } from "./shortcut-messages_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const shortcutMessages = await db.selectFrom('shortcutMessages')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return new Response(superjson.stringify(shortcutMessages satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching shortcut messages:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}