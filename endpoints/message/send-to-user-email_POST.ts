import { schema, OutputType } from "./send-to-user-email_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Chats, Messages } from "../../helpers/schema";

const createEmailHtml = (chat: Selectable<Chats>, message: Selectable<Messages>): string => {
  const chatLink = chat.shopDomain ? `https://${chat.shopDomain}` : '#';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; }
        .header h1 { font-size: 24px; color: #0055A4; margin: 0; font-weight: 600; }
        .content { padding: 20px 0; }
        .greeting { font-size: 16px; margin-bottom: 15px; }
                .message-box { background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; }
        .cta-container { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background-color: #E60028; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Australia Post All In One</h1>
        </div>
        <div class="content">
          <p class="greeting">Hello ${chat.merchantEmail},</p>
                    <p>You have a new message from our support team regarding your recent query.</p>
          <div class="message-box">
            <p>${message.content}</p>
          </div>
        </div>
        <div class="footer">
          <p>Sent by Subham from the Australia Post All In One Support Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { messageId } = schema.parse(json);

    const apiKey = process.env.BREVO_API_KEY;
    console.log("Brevo API key check:", apiKey ? "API key is present" : "API key is MISSING");
    if (!apiKey) {
      console.error("BREVO_API_KEY is not set.");
      throw new Error("Email service is not configured.");
    }

    const message = await db
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', messageId)
      .executeTakeFirst();

    if (!message) {
      throw new Error("Message not found.");
    }

    if (message.sender === 'user') {
      throw new Error("Cannot send a user's own message via email.");
    }

    const chat = await db
      .selectFrom('chats')
      .selectAll()
      .where('id', '=', message.chatId)
      .executeTakeFirst();

    if (!chat) {
      throw new Error("Associated chat not found.");
    }

    const emailHtmlBody = createEmailHtml(chat, message);

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: "Australia Post All In One Support - Subham",
          email: "subham@primecaves.com",
        },
        to: [
          {
            email: chat.merchantEmail,
            name: chat.merchantEmail,
          },
        ],
        subject: "Message from Australia Post All In One Support - Subham",
        htmlContent: emailHtmlBody,
      }),
    });

    if (!brevoResponse.ok) {
      console.error("Brevo API request failed with status:", brevoResponse.status);
      console.error("Response status text:", brevoResponse.statusText);
      
      let errorBody;
      try {
        const responseText = await brevoResponse.text();
        console.error("Full error response body (raw):", responseText);
        errorBody = JSON.parse(responseText);
        console.error("Parsed error response body:", JSON.stringify(errorBody, null, 2));
      } catch (parseError) {
        console.error("Failed to parse error response body:", parseError);
        errorBody = { message: "Could not parse error response" };
      }
      
      throw new Error(`Failed to send message email. Status: ${brevoResponse.status}, Error: ${JSON.stringify(errorBody)}`);
    }

    return new Response(superjson.stringify({
      success: true,
      message: "Message sent to user's email successfully."
    } satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in send-to-user-email endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}