import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const updatedEntry = await db.updateTable('knowledgeBase')
      .set({
        question: input.question,
        answer: input.answer,
        updatedAt: new Date(),
      })
      .where('id', '=', input.id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedEntry) {
      return new Response(superjson.stringify({ error: "Knowledge base entry not found" }), { status: 404 });
    }

    return new Response(superjson.stringify(updatedEntry satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating knowledge base entry:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}