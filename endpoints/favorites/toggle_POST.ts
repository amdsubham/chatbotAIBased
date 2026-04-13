import { db } from "../../helpers/db";
import { schema, OutputType } from "./toggle_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Check if already favorited
    const existing = await db
      .selectFrom("favoriteChats")
      .selectAll()
      .where("chatId", "=", input.chatId)
      .executeTakeFirst();

    if (existing) {
      // Remove favorite
      await db.deleteFrom("favoriteChats").where("chatId", "=", input.chatId).execute();
      return new Response(
        superjson.stringify({ favorited: false, chatId: input.chatId } satisfies OutputType),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Add favorite
      await db.insertInto("favoriteChats").values({ chatId: input.chatId }).execute();
      return new Response(
        superjson.stringify({ favorited: true, chatId: input.chatId } satisfies OutputType),
        { headers: { "Content-Type": "application/json" }, status: 201 }
      );
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}
