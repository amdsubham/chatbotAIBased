import { db } from "../../helpers/db";
import { schema, OutputType } from "./status_GET.schema";
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
      expirationSeconds: url.searchParams.get('expirationSeconds'),
    };

    const { chatId, expirationSeconds } = schema.parse(queryParams);

    const expirationDate = new Date(Date.now() - expirationSeconds * 1000);

    const activeTypers = await db
      .selectFrom('typingStatus')
      .select(['typerType', 'lastTypingAt'])
      .where('chatId', '=', chatId)
      .where('lastTypingAt', '>', expirationDate)
      .execute();

    return new Response(superjson.stringify(activeTypers satisfies OutputType), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error("Error fetching typing status:", error);
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