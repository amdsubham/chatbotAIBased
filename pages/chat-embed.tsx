import React, { useMemo, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ChatWidget, ChatWidgetConfig } from "../components/ChatWidget";
import styles from "./chat-embed.module.css";

// This type should align with ChatWidgetEmbedConfig in the helper,
// but we redefine it here to avoid cross-dependency.
interface EmbedConfig extends ChatWidgetConfig {
  apiUrl: string;
  merchantEmail: string;
  shopName?: string;
  shopDomain?: string;
  parentOrigin?: string;
}

const postResizeMessage = (
  targetOrigin: string,
  payload: {
    width: string;
    height: string;
    borderRadius: string;
  },
) => {
  if (window.parent) {
    window.parent.postMessage(
      {
        type: "floot-chat-resize",
        payload,
      },
      targetOrigin,
    );
  }
};

const ChatEmbedPage = () => {
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [widgetKey, setWidgetKey] = useState(Date.now());
  const [initialMessageOverride, setInitialMessageOverride] = useState<string | undefined>(undefined);

  // Derive parent origin once for consistent use throughout the component
  const parentOrigin = useMemo(() => {
    const configStr = searchParams.get("config");
    if (configStr) {
      try {
        const parsed = JSON.parse(configStr);
        if (parsed.parentOrigin) {
          return parsed.parentOrigin;
        }
      } catch (e) {
        // Continue to fallback
      }
    }
    // Fallback to referrer origin
    if (document.referrer) {
      try {
        return new URL(document.referrer).origin;
      } catch (e) {
        // Continue to fallback
      }
    }
    // Default to "*" for maximum compatibility
    return "*";
  }, [searchParams]);

  const { config, isDemoMode } = useMemo<{ config: EmbedConfig; isDemoMode: boolean }>(() => {
    const configStr = searchParams.get("config");
    if (!configStr) {
      console.log("Chat Embed: No 'config' parameter found. Using demo configuration.");
      return {
        config: {
          apiUrl: window.location.origin,
          merchantEmail: "demo@example.com",
          shopName: "Demo Shop",
          shopDomain: "demo.example.com",
          autoOpen: false,
          primaryColor: undefined,
          agentName: undefined,
          agentImageUrl: undefined,
          widgetPosition: 'bottom-right',
          isAdmin: false,
          initialMessage: undefined,
          hideContactForm: false,
        },
        isDemoMode: true,
      };
    }
    try {
      const parsed = JSON.parse(configStr);
      if (!parsed.apiUrl) {
        console.error("Chat Embed: 'apiUrl' is missing in the config.");
        // Fallback to demo config if apiUrl is missing
        return {
          config: {
            apiUrl: window.location.origin,
            merchantEmail: "demo@example.com",
            shopName: "Demo Shop",
            shopDomain: "demo.example.com",
            autoOpen: false,
            primaryColor: undefined,
            agentName: undefined,
            agentImageUrl: undefined,
            widgetPosition: 'bottom-right',
            isAdmin: false,
            initialMessage: undefined,
            hideContactForm: false,
          },
          isDemoMode: true,
        };
      }
      // Set initial open state from config
      setIsOpen(!!parsed.autoOpen);
      return { config: parsed as EmbedConfig, isDemoMode: false };
    } catch (error) {
      console.error("Chat Embed: Failed to parse 'config' query parameter.", error);
      // Fallback to demo config on parse error
      return {
        config: {
          apiUrl: window.location.origin,
          merchantEmail: "demo@example.com",
          shopName: "Demo Shop",
          shopDomain: "demo.example.com",
          autoOpen: false,
          primaryColor: undefined,
          agentName: undefined,
          agentImageUrl: undefined,
          widgetPosition: 'bottom-right',
          isAdmin: false,
          initialMessage: undefined,
          hideContactForm: false,
        },
        isDemoMode: true,
      };
    }
  }, [searchParams]);

  useEffect(() => {
    const handleHostMessage = (event: MessageEvent) => {
      // Security: validate incoming messages against parent origin
      // Skip validation only when parentOrigin is "*"
      if (parentOrigin !== "*" && event.origin !== parentOrigin) {
        return;
      }

      const { type, command, payload } = event.data;
      if (type === 'floot-chat-command') {
        console.log('[ChatEmbed] Received command:', command, payload);
        switch (command) {
          case 'open':
            setIsOpen(true);
            break;
          case 'close':
            setIsOpen(false);
            break;
          case 'openWithMessage':
            // To handle this, we need to force a re-render of ChatWidget
            // with the new initial message. The easiest way is to change its key.
            setInitialMessageOverride(payload.message);
            setIsOpen(true);
            setWidgetKey(Date.now()); // Force re-mount of ChatWidget
            break;
        }
      }
    };

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[ChatEmbed] Received custom event primecaves-chat-open:', customEvent.detail);
      if (customEvent.detail && customEvent.detail.message) {
        setInitialMessageOverride(customEvent.detail.message);
        setIsOpen(true);
        setWidgetKey(Date.now()); // Force re-mount of ChatWidget
      } else {
        // Open without message if no message provided
        setIsOpen(true);
      }
    };

    window.addEventListener('message', handleHostMessage);
    window.addEventListener('primecaves-chat-open', handleCustomEvent);
    
    return () => {
      window.removeEventListener('message', handleHostMessage);
      window.removeEventListener('primecaves-chat-open', handleCustomEvent);
    };
  }, [parentOrigin]);


  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      // Dimensions for the opened dialog state
      postResizeMessage(parentOrigin, {
        width: "420px",
        height: "70vh",
        borderRadius: "var(--radius-lg)",
      });
    } else {
      // Dimensions for the closed button state
      postResizeMessage(parentOrigin, {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
      });
    }
  };

  // The ChatWidget itself will handle the merchant details for chat creation.
  // We just need to pass the visual config.
  const widgetConfig: ChatWidgetConfig = {
    ...config,
    // The `autoOpen` prop is now controlled by the iframe's internal state
    // to allow for postMessage commands to open/close it.
    autoOpen: isOpen,
    // Allow postMessage to override the initial message from config
    initialMessage: initialMessageOverride ?? config.initialMessage,
    // Auto-skip contact form if merchantEmail is provided (unless explicitly overridden)
    // This enables seamless integration for external apps like Shopify
    hideContactForm: config.hideContactForm !== undefined ? config.hideContactForm : !!config.merchantEmail,
    // Default brand color
    primaryColor: config.primaryColor || "#dc1928",
    // Default agent identity
    agentName: config.agentName || "Subham Routray",
    agentImageUrl: config.agentImageUrl || "https://allinonelabels.s3.ap-southeast-2.amazonaws.com/images/SubhamR.png",
  };

  return (
    <>
      <Helmet>
        <title>Support Chat</title>
        <meta name="description" content="Embedded support chat widget." />
      </Helmet>
      <div className={styles.embedContainer}>
        {isDemoMode && (
          <div className={styles.demoBanner}>
            <span className={styles.demoIcon}>🔧</span>
            <span className={styles.demoText}>Demo Mode - No config provided</span>
          </div>
        )}
        <ChatWidget 
          key={widgetKey}
          config={widgetConfig} 
          onOpenChange={handleOpenChange}
          isEmbedded={true}
        />
      </div>
    </>
  );
};

export default ChatEmbedPage;