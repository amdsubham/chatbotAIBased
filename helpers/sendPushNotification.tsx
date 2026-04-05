import { db } from "./db";

interface PushNotificationParams {
  chatId: number;
  merchantEmail: string;
  shopName: string | null;
  message: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: { chatId: number };
  sound: "default";
  priority: "high";
}

/**
 * Send push notifications to all registered admin devices via Expo Push API.
 * Called alongside Telegram notifications when a user sends a message.
 */
export async function sendPushNotification(params: PushNotificationParams): Promise<void> {
  // Get all registered device tokens
  const tokens = await db
    .selectFrom("deviceTokens")
    .select(["token"])
    .execute();

  if (tokens.length === 0) {
    return;
  }

  const title = params.shopName
    ? `New message from ${params.shopName}`
    : `New message from ${params.merchantEmail}`;

  // Truncate long messages for the notification body
  const body = params.message.length > 200
    ? params.message.substring(0, 200) + "..."
    : params.message;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data: { chatId: params.chatId },
    sound: "default" as const,
    priority: "high" as const,
  }));

  // Expo Push API accepts batches of up to 100
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error("Expo Push API error:", response.status, await response.text());
      }

      const result = await response.json();

      // Clean up invalid tokens (DeviceNotRegistered errors)
      if (result.data) {
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
            // Remove invalid token from database
            await db
              .deleteFrom("deviceTokens")
              .where("token", "=", chunk[i].to)
              .execute()
              .catch(() => {}); // ignore cleanup errors
          }
        }
      }
    } catch (error) {
      console.error("Failed to send push notifications:", error);
    }
  }
}
