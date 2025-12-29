import { db } from "../../helpers/db";
import { schema, OutputType } from "./create_POST.schema";
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

    // Check if there's already an active chat for this merchant email
    const existingChat = await db
      .selectFrom('chats')
      .where('merchantEmail', '=', input.merchantEmail)
      .where('status', '=', 'active')
      .selectAll()
      .executeTakeFirst();

    if (existingChat) {
      console.log(`Reusing existing active chat (ID: ${existingChat.id}) for merchant: ${input.merchantEmail}`);
      return new Response(superjson.stringify(existingChat satisfies OutputType), {
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        status: 200,
      });
    }

    // No active chat found, create a new one
    console.log(`Creating new chat for merchant: ${input.merchantEmail}`);
    const newChat = await db.insertInto('chats')
      .values({
        merchantEmail: input.merchantEmail,
        shopName: input.shopName,
        shopDomain: input.shopDomain,
        errorContext: input.errorContext,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(newChat satisfies OutputType), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      status: 201,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
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