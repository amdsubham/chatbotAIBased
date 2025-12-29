import { schema, OutputType } from "./update-status_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { ZodError } from "zod";


export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { chatId, status } = schema.parse(json);

    const updatedChat = await db
      .updateTable('chats')
      .set({ status, updatedAt: new Date() })
      .where('id', '=', chatId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedChat) {
      return new Response(superjson.stringify({ error: `Chat with ID ${chatId} not found.` }), { status: 404 });
    }

    return new Response(superjson.stringify(updatedChat satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Failed to update chat status:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", issues: error.issues }), { status: 400 });
    }
        if (error instanceof Error) {
        return new Response(superjson.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred." }), { status: 500 });
  }
}