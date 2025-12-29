import { schema, OutputType } from "./delete_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    let deletedChatIds: number[];

    // Handle both single and bulk deletion
    if ('chatId' in input) {
      deletedChatIds = [input.chatId];
    } else {
      deletedChatIds = input.chatIds;
    }

    await db.transaction().execute(async (trx) => {
      // First, delete all messages associated with the chats
      await trx
        .deleteFrom('messages')
        .where('chatId', 'in', deletedChatIds)
        .execute();

      // Then, delete the chats themselves
      const deleteResult = await trx
        .deleteFrom('chats')
        .where('id', 'in', deletedChatIds)
        .executeTakeFirst();

      // If no chats were deleted, it means none existed
      if (deleteResult.numDeletedRows === 0n) {
        throw new Error(`No chats found with the provided ID(s).`);
      }
    });

    const response: OutputType = {
      success: true,
      message: deletedChatIds.length === 1 
        ? `Chat with ID ${deletedChatIds[0]} has been successfully deleted.`
        : `${deletedChatIds.length} chats have been successfully deleted.`,
      deletedChatIds,
    };

    return new Response(superjson.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Failed to delete chat(s):", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", issues: error.issues }), { status: 400 });
    }
    if (error instanceof Error) {
      // Check for the "not found" error message we threw
      if (error.message.includes("not found") || error.message.includes("No chats found")) {
        return new Response(superjson.stringify({ error: error.message }), { status: 404 });
      }
      return new Response(superjson.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred." }), { status: 500 });
  }
}