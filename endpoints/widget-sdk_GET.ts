import { getWidgetSdk } from "../helpers/getWidgetSdk";

export async function handle(request: Request) {
  try {
    const { origin } = new URL(request.url);
    const sdkScript = getWidgetSdk(origin);

    return new Response(sdkScript, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        // Cache the SDK for 1 hour, but allow revalidation
        "Cache-Control": "public, max-age=3600, must-revalidate",
        // CORS headers to allow loading from external domains (e.g., Shopify apps)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating widget SDK:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(`console.error("Failed to load chat widget SDK: ${errorMessage}");`, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        // CORS headers to allow loading from external domains (e.g., Shopify apps)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      status: 500,
    });
  }
}