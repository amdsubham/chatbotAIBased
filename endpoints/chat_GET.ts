import { db } from "../helpers/db";
import { schema, OutputType } from "./chat_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const url = new URL(request.url);
    const queryParams = {
      chatId: url.searchParams.get('chatId'),
    };

    const { chatId } = schema.parse(queryParams);

    const chat = await db.selectFrom('chats')
      .selectAll()
      .where('id', '=', chatId)
      .executeTakeFirst();

    if (!chat) {
      return new Response(superjson.stringify({ error: "Chat not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const messages = await db.selectFrom('messages')
      .selectAll()
      .where('chatId', '=', chatId)
      .orderBy('createdAt', 'asc')
      .execute();

    const responseData: OutputType = {
      ...chat,
      messages,
    };

    return new Response(superjson.stringify(responseData), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}