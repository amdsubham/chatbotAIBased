import { z } from "zod";

// This endpoint serves a JS file, so there's no JSON input/output schema.
// The client helper fetches the script content as text.

export const schema = z.object({});

export type OutputType = string; // The raw JavaScript content

export const getWidgetSdk = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/widget-sdk`, {
    method: "GET",
    ...init,
  });

  if (!result.ok) {
    const errorText = await result.text();
    throw new Error(
      `Failed to fetch widget SDK: ${result.status} ${result.statusText} - ${errorText}`
    );
  }

  return result.text();
};