export interface ChatWidgetEmbedConfig {
  /**
   * The base URL of the application hosting the chat widget embed page.
   * e.g., "https://yourapp.com"
   */
  apiUrl: string;
  /**
   * The primary color for the chat widget.
   * e.g., "#007bff"
   */
  primaryColor?: string;
  /**
   * The display name for the support agent.
   * e.g., "Support Bot"
   */
  agentName?: string;
  /**
   * The URL for the support agent's avatar image.
   */
  agentImageUrl?: string;
  /**
   * The position of the widget on the screen.
   * @default 'bottom-right'
   */
  position?: 'bottom-right' | 'bottom-left';
  /**
   * The email address of the user/merchant to identify them.
   */
  merchantEmail: string;
  /**
   * The name of the user's shop or company.
   */
  shopName?: string;
  /**
   * The domain of the user's shop or company.
   */
  shopDomain?: string;
}

/**
 * Generates a vanilla JavaScript embed script for the ChatWidget.
 * This script can be embedded into any HTML page to render the chat widget
 * within an iframe.
 *
 * @param config - The configuration object for the chat widget.
 * @returns A string containing the full JavaScript embed code.
 */
export const generateChatWidgetEmbedScript = (
  config: ChatWidgetEmbedConfig,
): string => {
  // We serialize the config to pass it to the script.
  // JSON.stringify is used twice: once for the JS object in the script,
  // and once to create the final string.
  const serializedConfig = JSON.stringify(config, null, 2);

  return `
(function() {
  "use strict";

  const config = ${serializedConfig};
  const iframeId = 'floot-chat-widget-iframe';

  // Prevent multiple instances of the widget from being loaded.
  if (document.getElementById(iframeId)) {
    console.warn('Floot Chat Widget script has already been loaded.');
    return;
  }

  // Create the iframe element
  const iframe = document.createElement('iframe');
  iframe.id = iframeId;
  iframe.title = 'Support Chat Widget';
  iframe.setAttribute('allow', 'fullscreen');

  // Construct the source URL for the iframe with the config as a query parameter.
  // The config is JSON stringified and then URI-encoded to be safely passed in the URL.
  const encodedConfig = encodeURIComponent(JSON.stringify(config));
  try {
    iframe.src = \`\${new URL('/chat-embed', config.apiUrl).href}?config=\${encodedConfig}\`;
  } catch (e) {
    console.error("Floot Chat Widget: Invalid apiUrl provided in config.", e);
    return;
  }

  // --- Initial Styling ---
  // These styles are for the initial "closed" state, showing only the trigger button.
  // The iframe will be resized via postMessage when the chat dialog is opened.
  const position = config.position || 'bottom-right';
  const initialWidth = '80px';
  const initialHeight = '80px';
  const sideOffset = '20px';

  const styles = {
    position: 'fixed',
    bottom: sideOffset,
    width: initialWidth,
    height: initialHeight,
    border: 'none',
    'border-radius': '50%', // Circular frame for the button
    'z-index': '2147483647', // Use a very high z-index to avoid being overlapped.
    'overflow': 'hidden',
    'box-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'transition': 'width 0.3s ease-in-out, height 0.3s ease-in-out, border-radius 0.3s ease-in-out',
  };

  if (position === 'bottom-left') {
    styles.left = sideOffset;
  } else {
    styles.right = sideOffset;
  }

  // Apply styles to the iframe
  Object.assign(iframe.style, styles);

  // Append the iframe to the document body
  document.body.appendChild(iframe);

  // --- PostMessage Communication Handler ---
  // Listen for messages from the iframe to handle dynamic resizing.
  window.addEventListener('message', function(event) {
    // Security: Always verify the origin of the message.
    try {
      if (event.origin !== new URL(config.apiUrl).origin) {
        return;
      }
    } catch (e) {
      // If apiUrl is invalid, we can't verify origin.
      return;
    }

    const data = event.data;

    // Check for the specific message type from our chat widget.
    if (data && data.type === 'floot-chat-resize' && data.payload) {
      const { width, height, borderRadius } = data.payload;
      if (width) {
        iframe.style.width = width;
      }
      if (height) {
        iframe.style.height = height;
      }
      if (borderRadius !== undefined) {
        iframe.style.borderRadius = borderRadius;
      }
    }
  });
})();
  `.trim();
};