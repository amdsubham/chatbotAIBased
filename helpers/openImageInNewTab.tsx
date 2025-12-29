/**
 * Safely opens an image in a new tab, handling both regular URLs and data URIs.
 * For data URIs, it converts them to a Blob and creates an object URL to prevent
 * issues with `window.open` showing a blank page in some browsers.
 *
 * @param imageUrl The URL of the image to open. Can be a standard URL or a data URI.
 */
export const openImageInNewTab = async (imageUrl: string): Promise<void> => {
  if (imageUrl.startsWith("data:image")) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const newTab = window.open(objectUrl, "_blank", "noopener,noreferrer");
      if (!newTab) {
        console.error("Failed to open new tab. Please check your browser's pop-up blocker settings.");
        URL.revokeObjectURL(objectUrl); // Clean up immediately if tab fails to open
        return;
      }

      // Revoke the object URL after a short delay to allow the new tab to load the image.
      // Using setTimeout ensures this happens on the next event loop tick.
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 100);
    } catch (error) {
      console.error("Error opening data URI image:", error);
    }
  } else {
    // For regular URLs, open them directly.
    const newTab = window.open(imageUrl, "_blank", "noopener,noreferrer");
    if (!newTab) {
        console.error("Failed to open new tab. Please check your browser's pop-up blocker settings.");
    }
  }
};