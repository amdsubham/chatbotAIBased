import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { db } from "../../helpers/db";
import { schema, InputType, OutputType } from "./analyze-conversation-for-qa_POST.schema";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Messages } from "../../helpers/schema";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const buildPrompt = (messages: Selectable<Messages>[]): string => {
  const conversationHistory = messages
    .map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`)
    .join('\n');

  return `
    Analyze the following support chat conversation. Your task is to extract a single, clear question from the user and synthesize a concise, helpful answer based on the responses from the admin or AI.

    **Conversation:**
    ---
    ${conversationHistory}
    ---

    **Instructions:**
    1.  **Identify the core problem or question** the user had. Rephrase it into a clear, standalone question that could be added to a knowledge base.
    2.  **Synthesize the solution.** Combine the key information from the 'admin' and 'ai' responses to create a comprehensive and easy-to-understand answer.
    3.  **Format the output** as a JSON object with two keys: "question" and "answer". Do not include any other text or markdown formatting.

    **Example Output:**
    {
      "question": "How do I reset my password if I've forgotten it?",
      "answer": "To reset your password, go to the login page and click the 'Forgot Password' link. You will receive an email with instructions to create a new password."
    }
  `;
};

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input: InputType = schema.parse(json);
    const { chatId } = input;

    const messages = await db.selectFrom('messages')
      .selectAll()
      .where('chatId', '=', chatId)
      .orderBy('createdAt', 'asc')
      .execute();

    if (messages.length === 0) {
      return new Response(superjson.stringify({ error: "No messages found for this chat." }), { status: 404 });
    }

    const prompt = buildPrompt(messages);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const generationConfig = {
      temperature: 0.2,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    };
    
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
    });

    const responseText = result.response.text();
    const qaPair = JSON.parse(responseText) as OutputType;

    if (!qaPair.question || !qaPair.answer) {
        throw new Error("AI failed to generate a valid Q&A pair.");
    }

    return new Response(superjson.stringify(qaPair satisfies OutputType), {
        headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error analyzing conversation for Q&A:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}