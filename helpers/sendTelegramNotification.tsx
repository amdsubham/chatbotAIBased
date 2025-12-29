import { z } from "zod";

// This helper is intended for server-side use only, as it accesses process.env.

const paramsSchema = z.object({
  userEmail: z.string().email(),
  message: z.string().min(1),
  chatId: z.number(),
  shopName: z.string().optional().nullable(),
  shopDomain: z.string().optional().nullable(),
});

type SendTelegramNotificationParams = z.infer<typeof paramsSchema>;

type SendTelegramNotificationResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Escapes a string for use in Telegram's HTML parse mode.
 * @param str The string to escape.
 * @returns The escaped string.
 */
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

/**
 * Sends a formatted notification to a Telegram chat via the Telegram Bot API.
 * This function is designed for server-side execution as it relies on environment variables.
 *
 * @param params - The parameters for the notification.
 * @param params.userEmail - The email of the user who sent the message.
 * @param params.message - The content of the message.
 * @param params.chatId - The internal database chat ID, used for context.
 * @param params.shopName - The name of the user's shop (optional).
 * @param params.shopDomain - The domain of the user's shop (optional).
 * @returns A promise that resolves to an object indicating success or failure.
 */
export const sendTelegramNotification = async (
  params: SendTelegramNotificationParams
): Promise<SendTelegramNotificationResult> => {
  try {
    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
      const errorMessage = "Invalid parameters for sendTelegramNotification";
      console.error(errorMessage, validation.error.flatten());
      return { success: false, error: errorMessage };
    }

    const { userEmail, message, shopName, shopDomain } = validation.data;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !telegramChatId) {
      const errorMessage =
        "Telegram bot token or chat ID is not configured in environment variables.";
      console.error(errorMessage);
      // In a real app, you might not want to expose this detail, but for debugging it's useful.
      // We fail silently in production from the caller's perspective.
      return { success: false, error: "Notification service not configured." };
    }

    let text = `<b>🔔 New Message Alert</b>\n\n`;
    text += `📧 <b>Email:</b> ${escapeHtml(userEmail)}\n`;
    if (shopName) {
      text += `🏪 <b>Shop:</b> ${escapeHtml(shopName)}\n`;
    }
    if (shopDomain) {
      text += `🌐 <b>Domain:</b> ${escapeHtml(shopDomain)}\n`;
    }
    text += `\n<pre>--------------------</pre>\n`;
    text += `💬 <b>Message:</b>\n<pre>${escapeHtml(message)}</pre>`;

    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      const errorMessage = `Failed to send Telegram notification: ${response.status} ${response.statusText}`;
      console.error(errorMessage, errorBody);
      return { success: false, error: errorMessage };
    }

    console.log("Successfully sent Telegram notification.");
    return { success: true };
  } catch (error) {
    const errorMessage = "An unexpected error occurred while sending Telegram notification.";
    console.error(errorMessage, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: errorMessage };
  }
};