import { getChat } from "../endpoints/chat_GET.schema";
import { postNotificationSendEmail } from "../endpoints/notification/send-email_POST.schema";

/**
 * Checks if an email notification should be sent for an unanswered chat and sends it if conditions are met.
 * This is intended to be called when a user's session ends (e.g., they close the chat widget).
 *
 * The conditions for sending an email are:
 * 1. The user has sent at least one message (`lastUserMessageAt` is not null).
 * 2. No admin has replied to the chat yet.
 * 3. An email notification has not already been sent for this chat.
 *
 * @param chatId The ID of the chat session to check.
 * @returns A promise that resolves when the check and potential email sending are complete.
 */
export const checkAndSendEmailNotification = async (chatId: number): Promise<void> => {
  try {
    // 1. Fetch the chat details, including all messages.
    const chatDetails = await getChat({ chatId });

    // 2. Check if any message in the chat was sent by an admin.
    const hasAdminMessage = chatDetails.messages.some(message => message.sender === 'admin');

    // 3. Check if the user has sent at least one message.
    const userHasSentMessage = !!chatDetails.lastUserMessageAt;

    // 4. Check if an email notification has already been sent to prevent duplicates.
    const notificationNotSent = !chatDetails.emailNotificationSent;

    console.log(`Checking notification conditions for chatId: ${chatId}`);
    console.log(`- User has sent a message: ${userHasSentMessage}`);
    console.log(`- Chat has an admin message: ${hasAdminMessage}`);
    console.log(`- Notification not already sent: ${notificationNotSent}`);

    // 5. If all conditions are met, call the endpoint to send the notification email.
    if (userHasSentMessage && !hasAdminMessage && notificationNotSent) {
      console.log(`Conditions met. Sending email notification for chatId: ${chatId}`);
      await postNotificationSendEmail({ chatId });
      console.log(`Email notification request sent successfully for chatId: ${chatId}`);
    } else {
      console.log(`Conditions not met. Skipping email notification for chatId: ${chatId}`);
    }
  } catch (error) {
    // Log errors gracefully without crashing the calling process.
    // This is important for a background task that shouldn't disrupt the user experience.
    if (error instanceof Error) {
        console.error(`Failed to check and send email notification for chatId ${chatId}:`, error.message);
    } else {
        console.error(`An unknown error occurred while processing notification for chatId ${chatId}:`, error);
    }
  }
};