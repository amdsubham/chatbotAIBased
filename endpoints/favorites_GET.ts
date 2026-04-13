import { db } from "../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const favorites = await db
      .selectFrom("favoriteChats")
      .selectAll()
      .orderBy("createdAt", "desc")
      .execute();

    const chatIds = favorites.map((f) => f.chatId);
    return new Response(superjson.stringify(chatIds), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return new Response(superjson.stringify({ error: "Failed to fetch favorites" }), {
      status: 500,
    });
  }
}
