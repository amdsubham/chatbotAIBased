import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { id, ...updateData } = input;

    const updatedSlot = await db.updateTable('availabilitySlots')
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedSlot) {
      return new Response(superjson.stringify({ error: "Availability slot not found" }), { status: 404 });
    }

    return new Response(superjson.stringify(updatedSlot satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating availability slot:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}