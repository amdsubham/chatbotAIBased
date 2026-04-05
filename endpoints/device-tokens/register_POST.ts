import { db } from "../../helpers/db";
import { getServerSessionOrThrow } from "../../helpers/getSetServerSession";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const session = await getServerSessionOrThrow(request);
    const userSession = await getServerUserSession(request);
    if (!userSession) {
      return Response.json({ message: "Not authenticated" }, { status: 401 });
    }

    const json = superjson.parse(await request.text()) as { token?: string; platform?: string };
    const { token, platform } = json;

    if (!token || typeof token !== "string") {
      return Response.json({ message: "Token is required" }, { status: 400 });
    }

    // Upsert: insert if not exists, update user_id if token already registered
    await db
      .insertInto("deviceTokens")
      .values({
        userId: userSession.user.id,
        token,
        platform: platform || "ios",
      })
      .onConflict((oc) =>
        oc.column("token").doUpdateSet({
          userId: userSession.user.id,
          platform: platform || "ios",
        })
      )
      .execute();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error registering device token:", error);
    return Response.json({ message: "Failed to register token" }, { status: 400 });
  }
}
