import { schema, OutputType } from "./send-email_POST.schema";
import { db } from "../../helpers/db";
import { EMAIL_SERVICE_ADMIN_TO } from "../../helpers/_publicConfigs";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Chats } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { chatId } = schema.parse(json);

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("BREVO_API_KEY is not set.");
      throw new Error("Email service is not configured.");
    }

    let chat: Selectable<Chats> | undefined;
    let messageCount = 0;

    await db.transaction().execute(async (trx) => {
      chat = await trx
        .selectFrom('chats')
        .selectAll()
        .where('id', '=', chatId)
        .executeTakeFirst();

      if (!chat) {
        throw new Error("Chat not found.");
      }

      if (chat.emailNotificationSent) {
        throw new Error("Notification for this chat has already been sent.");
      }

      const messageCountResult = await trx
        .selectFrom('messages')
        .select(db.fn.count('id').as('count'))
        .where('chatId', '=', chatId)
        .executeTakeFirst();
      
      messageCount = Number(messageCountResult?.count ?? 0);

      const adminUrl = new URL(request.url);
      const chatLink = `${adminUrl.origin}/admin?chatId=${chatId}`;

      const emailHtmlBody = `
        <h1>Unanswered Support Chat</h1>
        <p>A user left a chat session before receiving a response. Please follow up.</p>
        <h2>Chat Details:</h2>
        <ul>
          <li><strong>User Email:</strong> ${chat.merchantEmail}</li>
          <li><strong>Shop Name:</strong> ${chat.shopName || 'N/A'}</li>
          <li><strong>Shop Domain:</strong> ${chat.shopDomain || 'N/A'}</li>
          <li><strong>Error Context:</strong> ${chat.errorContext || 'N/A'}</li>
          <li><strong>Last User Message:</strong> ${chat.lastUserMessageAt ? new Date(chat.lastUserMessageAt).toLocaleString() : 'N/A'}</li>
          <li><strong>Total Messages:</strong> ${messageCount}</li>
        </ul>
        <p><a href="${chatLink}">Click here to view the full conversation</a></p>
      `;

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
              email: EMAIL_SERVICE_ADMIN_TO,
              name: EMAIL_SERVICE_ADMIN_TO,
            },
          ],
          subject: `Unanswered Support Chat - ${chat.merchantEmail}`,
          htmlContent: emailHtmlBody,
        }),
      });

      if (!brevoResponse.ok) {
        const errorBody = await brevoResponse.json();
        console.error("Failed to send email via Brevo:", errorBody);
        throw new Error(`Failed to send notification email. Status: ${brevoResponse.status}`);
      }

      await trx
        .updateTable('chats')
        .set({ emailNotificationSent: true, updatedAt: new Date() })
        .where('id', '=', chatId)
        .execute();
    });

    return new Response(superjson.stringify({
      success: true,
      message: "Notification email sent successfully."
    } satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in send-email endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}