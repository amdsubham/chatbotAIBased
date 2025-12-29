import { getDemoHtmlContent } from "../helpers/getDemoHtmlContent";

export async function handle(request: Request) {
  try {
    const { origin } = new URL(request.url);
    const htmlContent = getDemoHtmlContent(origin);

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="demo.html"',
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating demo HTML file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(`<h1>Error generating demo file</h1><p>${errorMessage}</p>`, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
      status: 500,
    });
  }
}