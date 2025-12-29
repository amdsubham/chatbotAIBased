import { schema, OutputType } from "./check-unseen-notifications_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { sql } from 'kysely';

export async function handle(request: Request) {
  try {
    schema.parse(superjson.parse(await request.text()));

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("BREVO_API_KEY is not set.");
      throw new Error("Email service is not configured.");
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const messagesToNotify = await db
      .selectFrom('messages')
      .innerJoin('chats', 'chats.id', 'messages.chatId')
      .select([
        'messages.id as messageId',
        'messages.chatId',
        'messages.content',
        'chats.merchantEmail',
        'chats.shopName'
      ])
      .where('messages.sender', 'in', ['admin', 'ai'])
      .where('messages.viewedAt', 'is', null)
      .where('messages.emailNotificationSentForMessage', '=', false)
      .where('messages.createdAt', '<', tenMinutesAgo)
      .orderBy('messages.chatId')
      .orderBy('messages.createdAt')
      .execute();

    if (messagesToNotify.length === 0) {
      return new Response(superjson.stringify({
        notificationsSent: 0,
        chatsNotified: 0
      } satisfies OutputType), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messagesByChat = messagesToNotify.reduce((acc, msg) => {
      if (!acc[msg.chatId]) {
        acc[msg.chatId] = {
          merchantEmail: msg.merchantEmail,
          shopName: msg.shopName,
          messages: [],
        };
      }
      acc[msg.chatId].messages.push({ id: msg.messageId, content: msg.content });
      return acc;
    }, {} as Record<number, { merchantEmail: string; shopName: string | null; messages: { id: number; content: string }[] }>);

    let notificationsSent = 0;
    const notifiedMessageIds: number[] = [];
    const adminUrl = new URL(request.url);

    for (const chatIdStr in messagesByChat) {
      const chatId = parseInt(chatIdStr, 10);
      const chatData = messagesByChat[chatId];
      const chatLink = `${adminUrl.origin}/admin?chatId=${chatId}`;
      const messageListHtml = chatData.messages.map(m => `<li>${m.content}</li>`).join('');

      const emailHtmlBody = `
        <h1>You have unread messages</h1>
        <p>A user you were chatting with has not seen your latest replies. Please check the conversation.</p>
        <h2>Chat Details:</h2>
        <ul>
          <li><strong>User Email:</strong> ${chatData.merchantEmail}</li>
          <li><strong>Shop Name:</strong> ${chatData.shopName || 'N/A'}</li>
        </ul>
        <h3>Unread Messages:</h3>
        <ul>${messageListHtml}</ul>
        <p><a href="${chatLink}">Click here to view the full conversation</a></p>
      `;

      try {
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: "Support System",
              email: "subham@primecaves.com",
            },
            to: [
              {
                email: chatData.merchantEmail,
                name: chatData.merchantEmail,
              },
            ],
            subject: `You have unread messages from support`,
            htmlContent: emailHtmlBody,
          }),
        });

        if (!brevoResponse.ok) {
          const errorBody = await brevoResponse.json();
          console.error(`Failed to send email for chat ${chatId}:`, errorBody);
          // Continue to next chat, don't mark messages as notified
          continue;
        }

        notificationsSent++;
        chatData.messages.forEach(msg => notifiedMessageIds.push(msg.id));

      } catch (emailError) {
        console.error(`Error sending email for chat ${chatId}:`, emailError);
      }
    }

    if (notifiedMessageIds.length > 0) {
      await db
        .updateTable('messages')
        .set({ emailNotificationSentForMessage: true })
        .where('id', 'in', notifiedMessageIds)
        .execute();
    }

    return new Response(superjson.stringify({
      notificationsSent,
      chatsNotified: Object.keys(messagesByChat).length,
    } satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in check-unseen-notifications endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}