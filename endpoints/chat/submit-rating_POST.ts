import { schema, OutputType } from "./submit-rating_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { chatId, rating, feedbackText } = schema.parse(json);

    const updatedChat = await db.transaction().execute(async (trx) => {
      // 1. Verify the chat exists and get its current state
      const chat = await trx
        .selectFrom('chats')
        .where('id', '=', chatId)
        .selectAll()
        .executeTakeFirst();

      if (!chat) {
        // Use a custom error to be caught and handled with a 404 status
        throw new Error(`Chat with ID ${chatId} not found.`);
      }

      // 2. Verify the chat is resolved
      if (chat.status !== 'resolved') {
        throw new Error("Chat must be resolved before rating.");
      }

      // 3. Check if chat has already been rated
      if (chat.rating !== null) {
        throw new Error("This chat has already been rated.");
      }

      // 4. Update the chat with the rating and feedback
      const result = await trx
        .updateTable('chats')
        .set({
          rating,
          feedbackText: feedbackText ?? null,
          ratedAt: new Date(),
          updatedAt: new Date(),
        })
        .where('id', '=', chatId)
        .returningAll()
        .executeTakeFirstOrThrow();
      
      return result;
    });

    const responsePayload: OutputType = {
      success: true,
      message: "Rating submitted successfully.",
      chat: updatedChat,
    };

    return new Response(superjson.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Failed to submit chat rating:", error);

    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", issues: error.issues }), { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return new Response(superjson.stringify({ error: error.message }), { status: 404 });
      }
      if (error.message.includes("resolved") || error.message.includes("rated")) {
        return new Response(superjson.stringify({ error: error.message }), { status: 400 });
      }
      return new Response(superjson.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(superjson.stringify({ error: "An unknown error occurred." }), { status: 500 });
  }
}