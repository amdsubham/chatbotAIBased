import { SignJWT } from "jose";
import {
  setServerSession,
  NotAuthenticatedError,
} from "../../helpers/getSetServerSession";
import { User } from "../../helpers/User";
import { getServerUserSession } from "../../helpers/getServerUserSession";

const jwtEncoder = new TextEncoder();
const jwtSecret = process.env.JWT_SECRET;

export async function handle(request: Request) {
  try {
    const { user, session } = await getServerUserSession(request);

    const sessionPayload = {
      id: session.id,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed.getTime(),
    };

    // Generate a refreshed JWT token for mobile clients
    // Mobile apps can't read HttpOnly Set-Cookie headers, so we return
    // the token in the response body. This keeps the session alive.
    const token = await new SignJWT(sessionPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(jwtEncoder.encode(jwtSecret));

    // Create response with user data + refreshed token
    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies User,
      token, // Mobile clients use this to stay logged in
    });

    // Update the session cookie (for web clients)
    await setServerSession(response, sessionPayload);

    return response;
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Session validation error:", error);
    return Response.json(
      { error: "Session validation failed" },
      { status: 400 }
    );
  }
}
