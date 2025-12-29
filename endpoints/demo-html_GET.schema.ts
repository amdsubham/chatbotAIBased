import { z } from "zod";

// This endpoint serves an HTML file, so there's no JSON input schema.
// The client helper fetches the HTML content as text.

export const schema = z.object({});

export type OutputType = string; // The raw HTML content

export const getDemoHtml = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/demo-html`, {
    method: "GET",
    ...init,
  });

  if (!result.ok) {
    const errorText = await result.text();
    throw new Error(
      `Failed to fetch demo HTML: ${result.status} ${result.statusText} - ${errorText}`
    );
  }

  return result.text();
};