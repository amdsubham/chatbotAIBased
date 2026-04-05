import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text()) as { token?: string };
    const { token } = json;

    if (!token || typeof token !== "string") {
      return Response.json({ message: "Token is required" }, { status: 400 });
    }

    await db
      .deleteFrom("deviceTokens")
      .where("token", "=", token)
      .execute();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error unregistering device token:", error);
    return Response.json({ message: "Failed to unregister token" }, { status: 400 });
  }
}
