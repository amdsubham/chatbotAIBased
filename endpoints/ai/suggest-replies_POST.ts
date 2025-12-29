import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { db } from "../../helpers/db";
import { schema, InputType, OutputType } from "./suggest-replies_POST.schema";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Messages } from "../../helpers/schema";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const buildPrompt = (
  errorContext: string | null | undefined,
  messages: Selectable<Messages>[],
  draftMessage?: string
): string => {
  const conversationHistory = messages
    .map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`)
    .join('\n');

  // Mode 2: Draft message provided - improve/correct/complete it
  if (draftMessage && draftMessage.trim()) {
    return `You are a professional writing assistant for technical support.

**IMPORTANT: The admin wants to communicate the following idea TO THE CUSTOMER:**
${draftMessage}

**Your task is to help the admin express this idea in a professional, clear, and helpful way.**

DO NOT respond to the draft as if the customer said it. The draft is what the ADMIN wants to say TO the customer, not what the customer said. You are improving how the admin can communicate their message to the customer.

For example:
- If the draft is "Australia post is bad", generate professional ways for the admin to tell the customer that Australia Post is problematic, such as:
  - "Unfortunately, Australia Post has been experiencing some service issues lately."
  - "I apologize for the inconvenience. Australia Post's delivery service has not been meeting expectations recently."

Based on the conversation context below, improve this draft message. Fix any grammar, spelling, or clarity issues. Make it professional and helpful. Keep the core meaning and intent of what the admin wants to communicate.

**Error Context:**
${errorContext || "No specific error context was provided."}

**Conversation History (most recent messages last):**
${conversationHistory}

**Instructions:**
1. Provide exactly 3 improved variations of the draft message:
   - First variation: A concise, direct version
   - Second variation: A more detailed, thorough version
   - Third variation: An empathetic, customer-friendly version
2. Each variation should maintain the original intent while improving clarity, professionalism, and helpfulness
3. Do not add any introductory text like "Here are three suggestions:"
4. Format your response as a JSON array of strings. For example: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
`;
  }

  // Mode 1: Empty draft - generate reply suggestions
  return `You are an expert technical support agent. Your task is to suggest three distinct, professional, and helpful replies for a support agent to send to a user.

Analyze the user's problem based on the provided error context and the last few messages in the conversation.

**Error Context:**
${errorContext || "No specific error context was provided."}

**Conversation History (most recent messages last):**
${conversationHistory}

**Instructions:**
1.  Generate exactly three concise, helpful, and professional reply suggestions.
2.  The suggestions should be different from each other in tone or approach (e.g., one direct, one more inquisitive, one empathetic).
3.  Do not add any introductory text like "Here are three suggestions:".
4.  Format your response as a JSON array of strings. For example: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
`;
};

const parseJsonResponse = (text: string): string[] => {
  try {
    // The API might return the JSON string inside a markdown code block.
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    const suggestions = JSON.parse(jsonString);
    if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
      return suggestions.slice(0, 3); // Ensure we only return up to 3
    }
  } catch (error) {
    console.error("Failed to parse AI response as JSON:", text, error);
  }
  // Fallback: if JSON parsing fails, split by newline and clean up.
  return text.split('\n')
    .map(s => s.trim().replace(/^- \d*\. /, '').replace(/^- /, ''))
    .filter(Boolean)
    .slice(0, 3);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isOverloadError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('503') || 
         message.includes('service unavailable') || 
         message.includes('overloaded');
};

const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('503') || 
         message.includes('service unavailable') || 
         message.includes('overloaded') ||
         message.includes('timeout') ||
         message.includes('network');
};

async function generateContentWithRetry(
  model: ReturnType<typeof genAI.getGenerativeModel>,
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`AI suggestion attempt ${attempt + 1}/${maxRetries}`);
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.error(`AI suggestion attempt ${attempt + 1} failed:`, error);
      
      // Only retry if it's a retryable error and we have attempts left
      if (isRetryableError(error) && attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        continue;
      }
      
      // If not retryable or no more retries, throw
      throw error;
    }
  }
  
  // Should never reach here, but TypeScript needs this
  throw lastError;
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input: InputType = schema.parse(json);
    const { chatId, draftMessage } = input;

    const [chat, recentMessages] = await Promise.all([
      db.selectFrom('chats')
        .select('errorContext')
        .where('id', '=', chatId)
        .executeTakeFirst(),
      db.selectFrom('messages')
        .selectAll()
        .where('chatId', '=', chatId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .execute(),
    ]);

    if (!chat) {
      return new Response(
        superjson.stringify({
          error: true,
          message: "Chat not found",
          retryable: false,
        } satisfies OutputType),
        { status: 404 }
      );
    }

    // Messages are fetched in descending order, so reverse them for chronological context
    const orderedMessages = recentMessages.reverse();

    const prompt = buildPrompt(chat.errorContext, orderedMessages, draftMessage);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    try {
      const responseText = await generateContentWithRetry(model, prompt, 3);
      const suggestions = parseJsonResponse(responseText);

      return new Response(superjson.stringify({ suggestions } satisfies OutputType), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error calling Gemini API after retries:", error);
      
      // Check if it's an overload error
      if (isOverloadError(error)) {
        return new Response(
          superjson.stringify({
            error: true,
            message: "AI service is temporarily busy. Please try again in a moment.",
            retryable: true,
          } satisfies OutputType),
          { status: 503 }
        );
      }
      
      // Check if it's any retryable error
      if (isRetryableError(error)) {
        return new Response(
          superjson.stringify({
            error: true,
            message: "Unable to connect to AI service. Please try again.",
            retryable: true,
          } satisfies OutputType),
          { status: 503 }
        );
      }
      
      // For other errors, provide a generic message
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      return new Response(
        superjson.stringify({
          error: true,
          message: `Failed to generate suggestions: ${errorMessage}`,
          retryable: false,
        } satisfies OutputType),
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error suggesting replies:", error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return new Response(
        superjson.stringify({
          error: true,
          message: "Invalid request data",
          retryable: false,
        } satisfies OutputType),
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      superjson.stringify({
        error: true,
        message: errorMessage,
        retryable: false,
      } satisfies OutputType),
      { status: 500 }
    );
  }
}