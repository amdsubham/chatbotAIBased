import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { chatId, typerType } = input;

    const now = new Date();

    await db
      .insertInto('typingStatus')
      .values({
        chatId,
        typerType,
        lastTypingAt: now,
        updatedAt: now,
      })
      .onConflict((oc) => oc
        .columns(['chatId', 'typerType'])
        .doUpdateSet({
          lastTypingAt: now,
          updatedAt: now,
        })
      )
      .execute();

    const response: OutputType = { success: true, message: "Typing status updated successfully." };
    return new Response(superjson.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error updating typing status:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}