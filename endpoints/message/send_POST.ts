import { db } from "../../helpers/db";
import { schema, OutputType } from "./send_POST.schema";
import superjson from 'superjson';
import { sendTelegramNotification } from "../../helpers/sendTelegramNotification";

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

    // Send Telegram notification for every user message
    if (input.sender === 'user') {
      try {
        // Fetch chat details for notification
        const chat = await db
          .selectFrom('chats')
          .select(['merchantEmail', 'shopName', 'shopDomain', 'id'])
          .where('id', '=', input.chatId)
          .executeTakeFirstOrThrow();

        // Send Telegram notification (don't await to avoid blocking)
        sendTelegramNotification({
          userEmail: chat.merchantEmail,
          message: input.content,
          chatId: chat.id,
          shopName: chat.shopName,
          shopDomain: chat.shopDomain,
        }).catch(error => {
          console.error('Failed to send Telegram notification:', error);
        });
      } catch (error) {
        // Log error but don't break the message sending flow
        console.error('Error checking for Telegram notification:', error);
      }
    }

    const newMessage = await db.transaction().execute(async (trx) => {
      // Insert the new message
      const message = await trx.insertInto('messages')
        .values({
          chatId: input.chatId,
          sender: input.sender,
          content: input.content,
          imageUrl: input.imageUrl,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Update the parent chat's updatedAt timestamp
      // If sender is "user", also update lastUserMessageAt
      const currentTime = new Date();
      const updateData: { updatedAt: Date; lastUserMessageAt?: Date } = {
        updatedAt: currentTime
      };
      
      if (input.sender === 'user') {
        updateData.lastUserMessageAt = currentTime;
      }

      await trx.updateTable('chats')
        .set(updateData)
        .where('id', '=', input.chatId)
        .execute();

      return message;
    });

    return new Response(superjson.stringify(newMessage satisfies OutputType), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      status: 201,
    });
  } catch (error) {
    console.error("Error sending message:", error);
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