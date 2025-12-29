import { db } from "../helpers/db";
import { OutputType } from "./availability-slots_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const availabilitySlots = await db.selectFrom('availabilitySlots')
      .selectAll()
      .orderBy('dayOfWeek', 'asc')
      .orderBy('startTime', 'asc')
      .execute();

    return new Response(superjson.stringify(availabilitySlots satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching availability slots:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}