import { schema, OutputType } from "./update-ai-setting_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { ZodError } from "zod";
import { getServerSessionOrThrow, NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerSessionOrThrow(request);

    const dbSession = await db
      .selectFrom('sessions')
      .where('id', '=', session.id)
      .select('userId')
      .executeTakeFirst();

    if (!dbSession) {
      throw new NotAuthenticatedError("Session not found in database.");
    }

    const user = await db
      .selectFrom('users')
      .where('id', '=', dbSession.userId)
      .select(['id', 'role'])
      .executeTakeFirst();

    if (!user || user.role !== 'admin') {
      return new Response(superjson.stringify({ error: 'Forbidden: Admin access required.' }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const { chatId, aiAutoResponseEnabled } = schema.parse(json);

    const updatedChat = await db
      .updateTable('chats')
      .set({ aiAutoResponseEnabled, updatedAt: new Date() })
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
    console.error("Failed to update chat AI setting:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", issues: error.issues }), { status: 400 });
    }
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 401 });
    }
    if (error instanceof Error) {
        return new Response(superjson.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred." }), { status: 500 });
  }
}