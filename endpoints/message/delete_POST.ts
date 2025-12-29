import { schema, OutputType } from "./delete_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { messageId } = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      const deleteResult = await trx
        .deleteFrom('messages')
        .where('id', '=', messageId)
        .executeTakeFirst();

      if (deleteResult.numDeletedRows === 0n) {
        throw new Error(`Message with ID ${messageId} not found.`);
      }
    });

    const response: OutputType = {
      success: true,
      message: `Message with ID ${messageId} has been successfully deleted.`,
      deletedMessageId: messageId,
    };

    return new Response(superjson.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Failed to delete message:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", issues: error.issues }), { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return new Response(superjson.stringify({ error: error.message }), { status: 404 });
      }
      return new Response(superjson.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred." }), { status: 500 });
  }
}