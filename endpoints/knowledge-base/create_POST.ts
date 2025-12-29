import { db } from "../../helpers/db";
import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newEntry = await db.insertInto('knowledgeBase')
      .values({
        question: input.question,
        answer: input.answer,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(newEntry satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    console.error("Error creating knowledge base entry:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}