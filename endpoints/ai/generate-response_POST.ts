import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { db } from "../../helpers/db";
import { schema, InputType } from "./generate-response_POST.schema";
import superjson from 'superjson';
import { checkAdminAvailability } from "../../helpers/checkAdminAvailability";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface ScoredKBEntry {
  question: string;
  answer: string;
  score: number;
}

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim()
    .replace(/\s+/g, ' '); // Normalize whitespace
};

const calculateSimilarity = (text1: string, text2: string): number => {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }
  
  // Calculate word overlap
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      intersection++;
    }
  }
  
  // Use Jaccard similarity: intersection / union
  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
};

const rankKnowledgeBaseEntries = (userMessage: string, kbEntries: Array<{ question: string; answer: string }>): ScoredKBEntry[] => {
  const scoredEntries = kbEntries.map(entry => ({
    question: entry.question,
    answer: entry.answer,
    score: calculateSimilarity(userMessage, entry.question),
  }));
  
  // Sort by score in descending order
  return scoredEntries.sort((a, b) => b.score - a.score);
};

// Helper function to convert time to Australian timezone and format as 12-hour with AM/PM
const formatTimeForAustralia = (day: string, time: string, timezone: string): string => {
  try {
    // Parse the time (format: "HH:MM:SS" or "HH:MM")
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a date object for the next occurrence of this day/time in the slot's timezone
    const now = new Date();
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const targetDay = dayMap[day];
    if (targetDay === undefined) {
      throw new Error(`Invalid day: ${day}`);
    }
    
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget < 0) daysUntilTarget += 7;
    if (daysUntilTarget === 0 && now.getHours() * 60 + now.getMinutes() > hours * 60 + minutes) {
      daysUntilTarget = 7; // If the time has passed today, use next week
    }
    
    // Create a date string in ISO format for the slot's timezone
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntilTarget);
    
    // Create a date string that represents this time in the slot's timezone
    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    const dateTimeStr = `${dateStr}T${timeStr}`;
    
    // Parse this as a date in the slot's timezone
    const slotTime = new Date(dateTimeStr + 'Z'); // Assume UTC for now, we'll adjust
    
    // If timezone is not UTC, we need to adjust
    // For simplicity, we'll format the time in Australian timezone
    const australianFormatter = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    // Create a date that represents the time in the slot's timezone
    // This is a bit tricky - we'll use Intl to help us
    const slotFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    // Get the current time in the slot's timezone to find the next occurrence
    const partsNow = slotFormatter.formatToParts(now);
    const nowInSlotTz = new Date(
      parseInt(partsNow.find(p => p.type === 'year')?.value || '0'),
      parseInt(partsNow.find(p => p.type === 'month')?.value || '1') - 1,
      parseInt(partsNow.find(p => p.type === 'day')?.value || '1'),
      parseInt(partsNow.find(p => p.type === 'hour')?.value || '0'),
      parseInt(partsNow.find(p => p.type === 'minute')?.value || '0'),
      parseInt(partsNow.find(p => p.type === 'second')?.value || '0')
    );
    
    // Calculate the target date in the slot's timezone
    const slotDate = new Date(nowInSlotTz);
    slotDate.setDate(slotDate.getDate() + daysUntilTarget);
    slotDate.setHours(hours, minutes, 0, 0);
    
    // Now format this in Australian timezone
    const australianTime = australianFormatter.format(slotDate);
    
    return australianTime;
  } catch (error) {
    console.error('Error formatting time for Australia:', error);
    // Fallback to simple 12-hour format without timezone conversion
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${day} at ${hour12}:${minutes.toString().padStart(2, '0')} ${ampm} Australian time`;
  }
};

const buildSystemPrompt = async (chatId: number, userMessage: string, errorContext: string | null | undefined): Promise<string> => {
  // Check admin availability
  const availabilitySlots = await db.selectFrom('availabilitySlots')
    .selectAll()
    .execute();
  
  const { isAvailable, nextAvailableSlot } = checkAdminAvailability(availabilitySlots);

  // Fetch chat details for merchant context
  const chat = await db.selectFrom('chats')
    .select(['shopName', 'shopDomain', 'merchantEmail'])
    .where('id', '=', chatId)
    .executeTakeFirst();

  const knowledgeBaseEntries = await db.selectFrom('knowledgeBase')
    .selectAll()
    .orderBy('createdAt', 'desc')
    .execute();

  const hasErrorContext = errorContext && errorContext.trim().length > 0;

  let prompt = '';

  // Build merchant context string
  let merchantContext = '';
  if (chat) {
    merchantContext = `You are assisting ${chat.merchantEmail}`;
    if (chat.shopName) {
      merchantContext += ` who uses ${chat.shopName}`;
    }
    if (chat.shopDomain) {
      merchantContext += ` (domain: ${chat.shopDomain})`;
    }
    merchantContext += '. ';
  }

  if (hasErrorContext) {
    // Debugging/troubleshooting focused prompt
    prompt = `You are a professional technical support assistant for the Australia Post shipping label generation system. ${merchantContext}Your role is to help users debug and resolve technical issues efficiently by analyzing errors and order data.

**RESPONSE FORMAT REQUIREMENTS:**
- **Be concise and direct** - keep answers under 150 words unless absolutely necessary
- **Answer the question directly first**, then provide brief additional context only if needed
- Use **bullet points** (•) or **numbered lists** (1., 2., 3.) for clarity
- **Break information into digestible chunks** - avoid long paragraphs
- Use **proper line breaks and spacing** between sections for readability
- Use **bold text** for key points and emphasis
- **No unnecessary elaboration** - get straight to the answer
- Make responses quick to read and easy to scan

**ERROR ANALYSIS EXPERTISE:**
When analyzing shipping label errors, you should:

1. **Identify the Root Cause**: Analyze the error message and order data to pinpoint the exact issue
2. **Check Order Data**: Review shipping address, customer name, packaging settings, and line items
3. **Validate Field Lengths**: Australia Post has strict field length limits (e.g., name max 40 characters)
4. **Address Validation**: Verify suburb/city, state code, and postcode combinations are valid
5. **Packaging & Weight**: Ensure packaging dimensions and weight are appropriate for the selected service
6. **Authentication Issues**: Identify API credential or permission problems

**COMMON ERROR TYPES:**
- **Name length errors**: Customer/business names exceeding 40 characters
- **Address validation**: Invalid suburb/state/postcode combinations
- **Authentication failures**: API key, merchant token, or account issues
- **JSON format errors**: Payload structure or special character issues
- **Weight/dimension issues**: Package specifications incompatible with service type

**YOUR RESPONSE SHOULD:**
✓ Start with the specific problem identified in the order data
✓ Explain WHY the error occurred (based on Australia Post requirements)
✓ Provide a clear, step-by-step solution
✓ Reference the specific order field(s) that need correction
✓ Be actionable - tell them exactly what to change

Analyze the error context and order data thoroughly to provide accurate, actionable solutions. Use the merchant context to better understand their specific situation.

`;
  } else {
    // Welcome/general-purpose prompt
    prompt = `You are a professional support assistant for this application. ${merchantContext}Your role is to provide accurate technical support, answer questions about the system's features and functionality, and help with various questions related to the user's work and applications.

**RESPONSE FORMAT REQUIREMENTS:**
- **Be concise and direct** - keep answers under 150 words unless absolutely necessary
- **Answer the question directly first**, then provide brief additional context only if needed
- Use **bullet points** (•) or **numbered lists** (1., 2., 3.) for clarity
- **Break information into digestible chunks** - avoid long paragraphs
- Use **proper line breaks and spacing** between sections for readability
- Use **bold text** for key points and emphasis
- **No unnecessary elaboration** - get straight to the answer
- Make responses quick to read and easy to scan

Be naturally helpful, conversational, and professional. Use the merchant context to better understand their questions and provide relevant assistance. You can help with technical support, feature questions, troubleshooting, and general questions that may be related to their work context.

`;
  }

  if (knowledgeBaseEntries.length > 0) {
    // Rank KB entries by relevance to user's message
    const rankedEntries = rankKnowledgeBaseEntries(userMessage, knowledgeBaseEntries);
    
    // Check if we have a highly relevant match (score > 0.5)
    const topEntry = rankedEntries[0];
    if (topEntry && topEntry.score > 0.5) {
      prompt += `MOST RELEVANT KNOWLEDGE BASE ENTRY:
Q: ${topEntry.question}
A: ${topEntry.answer}

`;
    }
    
    // Add all entries as reference
    prompt += `Here is the knowledge base of helpful information. Reference this when relevant to the user's question. Do not mention the knowledge base directly, just use the information naturally.
--- KNOWLEDGE BASE START ---
`;
    
    rankedEntries.forEach(entry => {
      prompt += `Q: ${entry.question}\nA: ${entry.answer}\n\n`;
    });
    
    prompt += `--- KNOWLEDGE BASE END ---\n`;
  } else {
    prompt += `--- KNOWLEDGE BASE START ---
No knowledge base entries available.
--- KNOWLEDGE BASE END ---
`;
  }

  if (hasErrorContext) {
    prompt += `
The user is currently experiencing a shipping label generation error. Below is the complete error context including order data:

--- ERROR CONTEXT START ---
${errorContext}
--- ERROR CONTEXT END ---

**ANALYSIS INSTRUCTIONS:**
1. Carefully review the ERROR DETAILS to understand what went wrong
2. Examine the ERROR CATEGORY to understand the type of issue
3. If AFFECTED ORDERS data is present, analyze:
   - Shipping address fields (check for length, format, validity)
   - Customer name (check if exceeds 40 characters)
   - Packaging settings (verify dimensions and postage type are compatible)
   - Order weight and line items
4. Cross-reference the error message with the order data to identify the exact problematic field(s)
5. Provide a specific, actionable solution referencing the actual data you see

Be precise and reference actual values from the order data in your response. Don't provide generic advice - use the specific information provided.`;
  } else {
    prompt += `
Provide clear, accurate, and professional responses to the user's questions and support requests. Be helpful and use context to understand what they need.`;
  }

  // Add support availability information - ONLY to be used when user asks to talk to support
  prompt += `

**SUPPORT TEAM AVAILABILITY:**
Only mention support team availability when the user explicitly asks to speak with a human agent, support team, or human support. Look for keywords like:
- "talk to support"
- "speak to human"
- "human agent"
- "talk to someone"
- "connect to agent"
- "speak with support"
- "human help"
- "real person"
- etc.

DO NOT mention support availability in regular responses. Only bring it up when the user requests human assistance.

When the user DOES ask to speak with support, respond based on current availability:
`;

  if (isAvailable) {
    prompt += `
✓ Support team is AVAILABLE NOW
When user asks for human support, respond conversationally like:
- "Our support team is available now! Would you like me to connect you?"
- "Great! Our support team is online right now and ready to help. Shall I connect you?"
- "Perfect timing! Our support team is available. Let me connect you with them."`;
  } else {
    if (nextAvailableSlot) {
      const formattedTime = formatTimeForAustralia(
        nextAvailableSlot.day,
        nextAvailableSlot.startTime,
        nextAvailableSlot.timezone
      );
      
      prompt += `
✗ Support team is OFFLINE
Next available: ${formattedTime}
When user asks for human support, respond conversationally like:
- "Our support team is currently offline. The next available time is ${formattedTime}. Feel free to leave your question here and we'll respond when available!"
- "I'm here to help, but our human support team is offline right now. They'll be back ${formattedTime}. You can leave a message and they'll get back to you!"
- "Our support team is currently away. They'll be available again ${formattedTime}. Feel free to continue chatting with me or leave a message for the team!"`;
    } else {
      prompt += `
✗ Support team is OFFLINE (no schedule set)
When user asks for human support, respond conversationally like:
- "Our support team is currently offline. Feel free to leave your question here and we'll respond as soon as we're back!"
- "I'm here to help! Our human support team is away at the moment, but you can leave a message and they'll get back to you soon."
- "Our support team is currently unavailable, but don't worry—leave your question here and we'll make sure they see it!"`;
    }
  }

  return prompt;
};

const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } | null => {
  // Format: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    console.error("Invalid data URL format:", dataUrl.substring(0, 50));
    return null;
  }
  return {
    mimeType: match[1],
    data: match[2],
  };
};

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
    const input: InputType = schema.parse(json);
    const { chatId, userMessage, userImageUrl, errorContext, previousMessages = [] } = input;

    const systemPrompt = await buildSystemPrompt(chatId, userMessage, errorContext);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    // Build history with support for images
    const history = previousMessages.map(msg => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      
      // Add text content
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      
      // Add image if present
      if (msg.imageUrl) {
        const parsedImage = parseDataUrl(msg.imageUrl);
        if (parsedImage) {
          parts.push({
            inlineData: {
              mimeType: parsedImage.mimeType,
              data: parsedImage.data,
            },
          });
        }
      }
      
      return {
        role: msg.sender === 'user' || msg.sender === 'admin' ? 'user' : 'model',
        parts,
      };
    });

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 2000,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Build current message with support for image
    const currentMessageParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: userMessage }
    ];
    
    if (userImageUrl) {
      const parsedImage = parseDataUrl(userImageUrl);
      if (parsedImage) {
        currentMessageParts.push({
          inlineData: {
            mimeType: parsedImage.mimeType,
            data: parsedImage.data,
          },
        });
      }
    }

    const result = await chat.sendMessageStream(currentMessageParts);

    let fullResponse = "";
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Iterate through the async generator
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }

          // After the loop completes, save the full AI response to the database
          if (fullResponse) {
            try {
              await db.transaction().execute(async (trx) => {
                await trx.insertInto('messages')
                  .values({
                    chatId: chatId,
                    sender: 'ai',
                    content: fullResponse,
                  })
                  .execute();
                await trx.updateTable('chats')
                  .set({ updatedAt: new Date() })
                  .where('id', '=', chatId)
                  .execute();
              });
              console.log(`Successfully saved AI response for chat ID: ${chatId}`);
            } catch (dbError) {
              console.error("Failed to save AI response to database:", dbError);
              // The stream has already finished, so we can't send an error to the client here.
              // The failure is logged on the server.
            }
          }

          // Close the controller
          controller.close();
        } catch (error) {
          console.error("Error during streaming:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (error) {
    console.error("Error generating AI response:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
}