import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Build the update object conditionally based on provided fields
    const updateData: any = {};
    if (input.autoAiResponseEnabled !== undefined) {
      updateData.autoAiResponseEnabled = input.autoAiResponseEnabled;
    }
    if (input.aiAgentName !== undefined) {
      updateData.aiAgentName = input.aiAgentName;
    }
    if (input.adminAgentName !== undefined) {
      updateData.adminAgentName = input.adminAgentName;
    }
    updateData.updatedAt = new Date();

    // The settings table is a singleton, so we update all rows (which should be just one).
    // We also update the `updatedAt` timestamp.
    const updatedSettings = await db.updateTable('settings')
      .set(updateData)
      .returningAll()
      .executeTakeFirstOrThrow(() => new Error("Settings row not found for update."));

    return new Response(superjson.stringify(updatedSettings satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}