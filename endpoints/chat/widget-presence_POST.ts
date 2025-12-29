import { schema, OutputType } from "./widget-presence_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { ZodError } from "zod";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function handle(request: Request) {
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    const json = superjson.parse(await request.text());
    const { chatId, isOpen } = schema.parse(json);

    const updatedChat = await db
      .updateTable('chats')
      .set({ 
        widgetOpen: isOpen, 
        widgetLastSeenAt: new Date() 
      })
      .where('id', '=', chatId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedChat) {
      return new Response(superjson.stringify({ error: `Chat with ID ${chatId} not found.` }), { 
        status: 404,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(superjson.stringify(updatedChat satisfies OutputType), {
      headers: { 
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Failed to update widget presence:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", issues: error.issues }), { 
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }
    if (error instanceof Error) {
        return new Response(superjson.stringify({ error: error.message }), { 
          status: 500,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
        });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred." }), { 
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  }
}