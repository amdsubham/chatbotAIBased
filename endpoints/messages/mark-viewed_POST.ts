import { schema, OutputType } from "./mark-viewed_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { chatId } = schema.parse(json);

    const result = await db
      .updateTable('messages')
      .set({ viewedAt: new Date() })
      .where('chatId', '=', chatId)
      .where('viewedAt', 'is', null)
      .executeTakeFirst();

    const markedCount = Number(result.numUpdatedRows);

    console.log(`Marked ${markedCount} messages as viewed for chat ID: ${chatId}`);

    return new Response(superjson.stringify({ markedCount } satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in mark-viewed endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}