/**
 * Generates the complete, self-contained JavaScript SDK string.
 * This function is designed to be used on the server-side to generate the
 * script that will be served by the `widget-sdk_GET` endpoint.
 *
 * @param defaultApiBaseUrl - The default base URL for the API, typically the origin of the server.
 * @returns A string containing the full JavaScript SDK code.
 */
export const getWidgetSdk = (defaultApiBaseUrl: string): string => {
  // We wrap the entire SDK in an IIFE to avoid polluting the global scope
  // with anything other than the main `PrimeCavesChatWidget` object.
  return `
(function () {
  "use strict";

  // --- State Management ---
  let config = null;
  let iframe = null;
  let iframeContainer = null;
  let isInitialized = false;
  let isWidgetOpen = false;

  // --- Default Styles ---
  const initialStyles = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
  };

  const containerStyles = {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: initialStyles.width,
    height: initialStyles.height,
    border: 'none',
    zIndex: '2147483647', // Max z-index
    transition: 'width 0.3s ease, height 0.3s ease, border-radius 0.3s ease',
    overflow: 'hidden',
    borderRadius: initialStyles.borderRadius,
  };

  const iframeStyles = {
    width: '100%',
    height: '100%',
    border: 'none',
  };

  // --- Core Functions ---

  function destroy() {
    if (iframeContainer) {
      iframeContainer.remove();
    }
    if (iframe) {
      iframe.remove();
    }
    window.removeEventListener('message', handlePostMessage);
    iframeContainer = null;
    iframe = null;
    config = null;
    isInitialized = false;
    isWidgetOpen = false;
    console.log('[PrimeCavesChatWidget] Widget destroyed.');
  }

  function createWidget() {
    if (!config) {
      console.error('[PrimeCavesChatWidget] Cannot create widget: config is missing. Call init() first.');
      return;
    }

    // Clean up any previous instance
    if (isInitialized) {
      destroy();
    }

    // 1. Create the container div
    iframeContainer = document.createElement('div');
    Object.assign(iframeContainer.style, containerStyles);
    
    // Adjust position based on config
    if (config.widgetPosition === 'bottom-left') {
        iframeContainer.style.right = 'auto';
        iframeContainer.style.left = '2rem';
    } else {
        iframeContainer.style.left = 'auto';
        iframeContainer.style.right = '2rem';
    }

    // 2. Create the iframe
    iframe = document.createElement('iframe');
    Object.assign(iframe.style, iframeStyles);
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('title', 'Support Chat Widget');

    const apiBaseUrl = config.apiBaseUrl || '${defaultApiBaseUrl}';
    const configParam = encodeURIComponent(JSON.stringify({ ...config, apiUrl: apiBaseUrl }));
    iframe.src = \`\${apiBaseUrl}/chat-embed?config=\${configParam}\`;

    // 3. Append to DOM
    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);

    // 4. Add event listener for communication
    window.addEventListener('message', handlePostMessage);

    isInitialized = true;
    console.log('[PrimeCavesChatWidget] Widget initialized.');
  }

  function handlePostMessage(event) {
    // Security: Ensure the message is from our iframe's origin
    const apiBaseUrl = config.apiBaseUrl || '${defaultApiBaseUrl}';
    if (event.origin !== new URL(apiBaseUrl).origin) {
      return;
    }

    if (event.data && event.data.type === 'floot-chat-resize') {
      const { width, height, borderRadius } = event.data.payload;
      if (iframeContainer) {
        iframeContainer.style.width = width;
        iframeContainer.style.height = height;
        iframeContainer.style.borderRadius = borderRadius;
        isWidgetOpen = height !== initialStyles.height;
      }
    }
  }

  function postCommandToIframe(command, payload) {
    if (!iframe || !iframe.contentWindow) {
      console.error('[PrimeCavesChatWidget] Iframe not available to send command:', command);
      return;
    }
    const apiBaseUrl = config.apiBaseUrl || '${defaultApiBaseUrl}';
    iframe.contentWindow.postMessage({ type: 'floot-chat-command', command, payload }, new URL(apiBaseUrl).origin);
  }

  // --- Public API ---

  const PrimeCavesChatWidget = {
    init: function (userConfig) {
      if (!userConfig || !userConfig.merchantEmail) {
        console.error('[PrimeCavesChatWidget] init() requires a config object with at least a "merchantEmail".');
        return;
      }
      config = userConfig;
      createWidget();
    },

    open: function () {
      if (!isInitialized) {
        console.warn('[PrimeCavesChatWidget] Widget not initialized. Call init() first.');
        return;
      }
      if (!isWidgetOpen) {
        postCommandToIframe('open');
      }
    },

    close: function () {
      if (!isInitialized) return;
      if (isWidgetOpen) {
        postCommandToIframe('close');
      }
    },

    openWithMessage: function (message) {
      if (!isInitialized) {
        console.warn('[PrimeCavesChatWidget] Widget not initialized. Call init() first.');
        // If not initialized, we can update the config and re-init
        if (config) {
            config.initialMessage = message;
            config.autoOpen = true;
            createWidget();
        } else {
            console.error('[PrimeCavesChatWidget] Cannot open with message: config is missing.');
        }
        return;
      }
      
      // If already initialized, send a command to open with a new message
      postCommandToIframe('openWithMessage', { message });
    },

    sendMessage: function (message) {
      if (!isInitialized || !iframe) {
        console.warn('[PrimeCavesChatWidget] Widget not initialized. Call init() first.');
        return;
      }
      try {
        // Dispatch custom event on the iframe's window
        iframe.contentWindow.dispatchEvent(new CustomEvent('primecaves-chat-open', {
          detail: { message: message }
        }));
      } catch (error) {
        console.error('[PrimeCavesChatWidget] Error sending message:', error);
      }
    },

    destroy: destroy,
  };

  window.PrimeCavesChatWidget = PrimeCavesChatWidget;
})();
`;
};