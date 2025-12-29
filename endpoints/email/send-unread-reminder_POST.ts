import { schema, OutputType } from "./send-unread-reminder_POST.schema";
import { db } from "../../helpers/db";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    schema.parse(json);

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("BREVO_API_KEY is not set.");
      throw new Error("Email service is not configured.");
    }

    // Calculate time variables
    const fiveMinutesAgoForMessage = new Date(Date.now() - 5 * 60 * 1000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Create derived table to get the latest message per chat
    const latestMessagesPerChat = db
      .selectFrom("messages")
      .select(["chatId", sql<number>`MAX(id)`.as("latestMessageId")])
      .groupBy("chatId")
      .as("latest");

    // Execute main query and assign to eligibleMessages
    const eligibleMessages = await db
      .selectFrom("messages as m")
      .innerJoin(latestMessagesPerChat, (join) =>
        join
          .onRef("latest.chatId", "=", "m.chatId")
          .onRef("latest.latestMessageId", "=", "m.id"),
      )
      .innerJoin("chats as c", "c.id", "m.chatId")
      .select([
        "m.id as messageId",
        "m.chatId",
        "m.content",
        "m.createdAt",
        "c.merchantEmail",
        "c.shopName",
      ])
      .where("m.sender", "in", ["admin", "ai"])
      .where("m.viewedAt", "is", null)
      .where("m.emailNotificationSentForMessage", "=", false)
      .where("m.createdAt", "<=", fiveMinutesAgoForMessage)
      .where("c.status", "=", "active")
      .where((eb) =>
        eb.or([
          eb("c.widgetOpen", "=", false),
          eb("c.widgetLastSeenAt", "<=", fiveMinutesAgo),
          eb("c.widgetLastSeenAt", "is", null),
        ]),
      )
      .execute();

    console.log(
      `Found ${eligibleMessages.length} unread messages requiring reminders`,
    );

    let emailsSent = 0;

    await db.transaction().execute(async (trx) => {
      for (const msg of eligibleMessages) {
        try {
          const truncatedContent =
            msg.content.length > 200
              ? msg.content.substring(0, 200) + "..."
              : msg.content;

          const chatLink = `https://primecaves-chatbot.floot.app/chat-embed?config=${encodeURIComponent(
            JSON.stringify({
              apiUrl: "https://primecaves-chatbot.floot.app",
              merchantEmail: msg.merchantEmail,
              shopName: msg.shopName || "Your Shop",
            }),
          )}`;

          const emailHtmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">You have an unread message from support</h2>
              <p style="color: #666; line-height: 1.6;">
                Hi there! We sent you a message about your support inquiry, but it looks like you haven't seen it yet.
              </p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #333; font-style: italic;">"${truncatedContent}"</p>
              </div>
              <p style="color: #666; line-height: 1.6;">
                We're here to help! Click the button below to continue the conversation.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${chatLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Continue Conversation
                </a>
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 40px;">
                This is an automated reminder from the Universal AI Support Chatbot System.
              </p>
            </div>
          `;

          const brevoResponse = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
              method: "POST",
              headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                sender: {
                  name: "Support Team",
                  email: "subham@primecaves.com",
                },
                to: [
                  {
                    email: msg.merchantEmail,
                    name: msg.merchantEmail,
                  },
                ],
                subject: "You have an unread message from support",
                htmlContent: emailHtmlBody,
              }),
            },
          );

          if (!brevoResponse.ok) {
            const errorBody = await brevoResponse.json();
            console.error(
              `Failed to send reminder email to ${msg.merchantEmail}:`,
              errorBody,
            );
            console.error(
              `Brevo API error. Please check your BREVO_API_KEY and ensure the sender email is verified.`,
            );
            continue; // Skip this message but continue with others
          }

          await trx
            .updateTable("messages")
            .set({ emailNotificationSentForMessage: true })
            .where("id", "=", msg.messageId)
            .execute();

          emailsSent++;
          console.log(
            `Sent reminder email to ${msg.merchantEmail} for message ${msg.messageId}`,
          );
        } catch (err) {
          console.error(`Error processing message ${msg.messageId}:`, err);
          // Continue with other messages
        }
      }
    });

    return new Response(
      superjson.stringify({
        success: true,
        emailsSent,
        message: `Successfully sent ${emailsSent} reminder email(s).`,
      } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in send-unread-reminder endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}