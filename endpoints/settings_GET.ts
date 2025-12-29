import { db } from "../helpers/db";
import { OutputType } from "./settings_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    // The settings table is expected to have exactly one row.
    // If it doesn't, something is wrong with the system setup, so we throw an error.
    const settings = await db.selectFrom('settings')
      .selectAll()
      .executeTakeFirstOrThrow(() => new Error("Settings row not found in the database."));

    return new Response(superjson.stringify(settings satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}