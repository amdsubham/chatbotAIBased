import React, { useState, useRef, useEffect, CSSProperties, useMemo } from "react";
import { MessageSquare, X, Minus } from "lucide-react";
import type { Selectable } from "kysely";
import type { Messages } from "../helpers/schema";
import { AdminAvailabilityStatus } from "./AdminAvailabilityStatus";
import { NotificationBadge } from "./NotificationBadge";
import { checkAndSendEmailNotification } from "../helpers/checkAndSendEmailNotification";
import { useCreateChatMutation } from "../helpers/useCreateChatMutation";
import { useSendMessageMutation } from "../helpers/useSendMessageMutation";
import { useUpdateWidgetPresenceMutation } from "../helpers/useUpdateWidgetPresenceMutation";
import { useErrorHandler } from "../helpers/useErrorHandler";
import superjson from 'superjson';
import { formatErrorContext } from "../helpers/formatErrorContext";
import { useChatQuery } from "../helpers/useChatQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useAiGenerateResponseMutation } from "../helpers/useAiGenerateResponseMutation";
import { useSettingsQuery } from "../helpers/useSettingsQuery";
import { Button } from "./Button";
import { NewChatForm } from "./NewChatForm";
import { ChatView } from "./ChatView";
import styles from "./ChatWidget.module.css";

export interface ChatWidgetConfig {
  primaryColor?: string;
  agentName?: string;
  agentImageUrl?: string;
  widgetPosition?: 'bottom-right' | 'bottom-left';
  isAdmin?: boolean;
  merchantEmail?: string;
  shopName?: string;
  shopDomain?: string;
  autoOpen?: boolean;
  initialMessage?: string;
  hideContactForm?: boolean;
  apiBaseUrl?: string;
}

export interface ChatWidgetProps {
  config?: ChatWidgetConfig;
  onOpenChange?: (open: boolean) => void;
  isEmbedded?: boolean;
}

export const ChatWidget = ({ config, onOpenChange, isEmbedded = false }: ChatWidgetProps) => {
  const {
    primaryColor,
    agentName = "Subham Routray",
    agentImageUrl,
    widgetPosition = 'bottom-right',
    isAdmin = false,
    merchantEmail,
    shopName,
    shopDomain,
    autoOpen = false,
    initialMessage,
    hideContactForm = false,
    apiBaseUrl,
  } = config || {};
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [autoOpenedDueToError, setAutoOpenedDueToError] = useState(false);
  const [initialErrorContext, setInitialErrorContext] = useState<string | undefined>(undefined);
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState<number>(() => {
    if (activeChatId) {
      const stored = localStorage.getItem(`chatWidget_lastSeen_${activeChatId}`);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
    const queryClient = useQueryClient();
  const createChatMutation = useCreateChatMutation(apiBaseUrl);
  const sendMessageMutation = useSendMessageMutation(apiBaseUrl);
  const updateWidgetPresenceMutation = useUpdateWidgetPresenceMutation(apiBaseUrl);
  const aiGenerateResponseMutation = useAiGenerateResponseMutation();
  const { data: settings } = useSettingsQuery();
  const { latestError, hasUnhandledError, clearError } = useErrorHandler();
  const { data: chatData } = useChatQuery(
    { chatId: activeChatId! },
    { enabled: !!activeChatId && !isOpen, refetchInterval: 3000 }
  );
  const handledErrorRef = useRef<string | null>(null);
  const autoCreatedChatRef = useRef(false);
  const initialMessageSentRef = useRef(false);
  const notificationAudio = useMemo(() => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audio.volume = 0.5;
    return audio;
  }, []);
  const previousUnreadCountRef = useRef<number>(0);

  // Load lastSeenMessageCount from localStorage when activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      const stored = localStorage.getItem(`chatWidget_lastSeen_${activeChatId}`);
      const storedCount = stored ? parseInt(stored, 10) : 0;
      console.log(`[ChatWidget] Loaded lastSeenMessageCount from localStorage for chat ${activeChatId}:`, storedCount);
      setLastSeenMessageCount(storedCount);
    }
  }, [activeChatId]);

  // Auto-open on mount if configured
  useEffect(() => {
    if (autoOpen && !isOpen) {
      console.log("[ChatWidget] Auto-opening chat widget on mount");
      setIsOpen(true);
      onOpenChange?.(true);
    }
  }, [autoOpen]);

  // Auto-create chat if hideContactForm is true and all user details are provided
  useEffect(() => {
    const shouldAutoCreateChat = 
      merchantEmail && 
      shopName && 
      shopDomain && 
      !activeChatId && 
      !autoCreatedChatRef.current &&
      !createChatMutation.isPending;

    if (shouldAutoCreateChat) {
      console.log("[ChatWidget] Auto-creating chat with provided user details");
      autoCreatedChatRef.current = true;
      
      createChatMutation.mutate(
        {
          merchantEmail,
          shopName,
          shopDomain,
          errorContext: initialErrorContext || null,
        },
        {
          onSuccess: (chat) => {
            console.log("[ChatWidget] Auto-created chat:", chat.id);
            setActiveChatId(chat.id);
            
            // Clear error if this was auto-opened due to error
            if (autoOpenedDueToError && hasUnhandledError) {
              console.log("[ChatWidget] Clearing error after auto-created chat");
              clearError();
            }
          },
          onError: (error) => {
            console.error("[ChatWidget] Error auto-creating chat:", error);
            // Reset flag so user can try again
            autoCreatedChatRef.current = false;
          },
        }
      );
    }
  }, [
    merchantEmail,
    shopName,
    shopDomain,
    activeChatId,
    initialErrorContext,
    autoOpenedDueToError,
    hasUnhandledError,
    clearError,
  ]);

  // Auto-send initial message after chat is created with streaming AI response
  useEffect(() => {
    const shouldSendInitialMessage = 
      activeChatId && 
      initialMessage && 
      !initialMessageSentRef.current &&
      !sendMessageMutation.isPending;

    if (shouldSendInitialMessage) {
      console.log("[ChatWidget] Auto-sending initial message:", initialMessage);
      initialMessageSentRef.current = true;
      
      // Async handler to send message and trigger streaming AI
      const sendInitialMessageWithAi = async () => {
        try {
          // 1. Send the user message
          await sendMessageMutation.mutateAsync({
            chatId: activeChatId,
            sender: "user",
            content: initialMessage,
          });

          console.log("[ChatWidget] Initial message sent successfully");

          // 2. Check if AI is enabled (chat-level or global setting)
          const effectiveAiEnabled = chatData?.aiAutoResponseEnabled ?? settings?.autoAiResponseEnabled ?? false;
          
          console.log('[ChatWidget] AI auto-response decision for initial message:', {
            chatLevelSetting: chatData?.aiAutoResponseEnabled,
            globalSetting: settings?.autoAiResponseEnabled,
            effectiveSetting: effectiveAiEnabled,
          });

          // 3. If AI is enabled, trigger streaming AI response
          if (effectiveAiEnabled) {
            console.log("[ChatWidget] Triggering streaming AI response for initial message");
            
            // Get previous messages for context (if chat already has messages)
            const previousMessages = chatData?.messages?.map(msg => ({
              sender: msg.sender,
              content: msg.content,
              imageUrl: msg.imageUrl || null,
            })) || [];

            // Call streaming AI endpoint
            const stream = await aiGenerateResponseMutation.mutateAsync({
              chatId: activeChatId,
              userMessage: initialMessage,
              userImageUrl: null,
              errorContext: chatData?.errorContext || initialErrorContext || null,
              previousMessages,
            });

            // Consume the stream
            if (stream) {
              const reader = stream.getReader();
              const decoder = new TextDecoder();
              
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  const chunk = decoder.decode(value, { stream: true });
                  console.log("[ChatWidget] Received AI response chunk for initial message:", chunk);
                }
                console.log("[ChatWidget] AI response streaming completed for initial message");
                
                // Invalidate queries after stream completes to ensure AI message is in DB
                await queryClient.invalidateQueries({ queryKey: ["chat", activeChatId] });
                await queryClient.invalidateQueries({ queryKey: ["chats"] });
              } catch (streamError) {
                console.error("[ChatWidget] Error reading AI response stream:", streamError);
              } finally {
                reader.releaseLock();
              }
            }
          } else {
            console.log("[ChatWidget] AI auto-response is disabled, skipping AI for initial message");
          }
        } catch (error) {
          console.error("[ChatWidget] Error in sendInitialMessageWithAi:", error);
          // Reset flag so it can retry if needed
          initialMessageSentRef.current = false;
        }
      };

      sendInitialMessageWithAi();
    }
  }, [activeChatId, initialMessage, chatData, settings, initialErrorContext, queryClient, aiGenerateResponseMutation, sendMessageMutation]);

  // Track page presence when chat is created (not based on widget open/close state)
  useEffect(() => {
    if (activeChatId) {
      console.log('[ChatWidget] Chat created, marking merchant as online (page loaded)');
      updateWidgetPresenceMutation.mutate({
        chatId: activeChatId,
        isOpen: true, // Always true while page is loaded
      });
    }
  }, [activeChatId]);

  // Periodic polling to keep page presence fresh (runs when chat exists)
  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    console.log('[ChatWidget] Starting periodic page presence updates for chat', activeChatId);

    // Update presence every 60 seconds to keep widgetLastSeenAt fresh
    // Always send isOpen: true because we're tracking page presence, not widget open/close state
    const intervalId = setInterval(() => {
      console.log('[ChatWidget] Periodic page presence update - merchant is still on page');
      updateWidgetPresenceMutation.mutate({
        chatId: activeChatId,
        isOpen: true, // Always true - we're tracking page presence
      });
    }, 60000); // 60 seconds

    // Cleanup interval on unmount or when activeChatId changes
    return () => {
      console.log('[ChatWidget] Stopping periodic page presence updates');
      clearInterval(intervalId);
    };
  }, [activeChatId]);

  // Cleanup: Mark widget as offline when page unloads (more reliable than component unmount)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeChatId) {
        console.log('[ChatWidget] Page unloading, marking widget as offline');

        // Use sendBeacon for reliable delivery during page unload
        // This is more reliable than fetch/XHR during unload events
        const baseUrl = apiBaseUrl || '';
        // IMPORTANT: Use superjson.stringify to match the endpoint's expected format
        const data = superjson.stringify({ chatId: activeChatId, isOpen: false });

        try {
          // Try sendBeacon first (most reliable)
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(`${baseUrl}/_api/chat/widget-presence`, blob);
        } catch (error) {
          console.error('[ChatWidget] Error sending beacon:', error);
          // Fallback to synchronous XHR if sendBeacon fails
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${baseUrl}/_api/chat/widget-presence`, false); // false = synchronous
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(data);
          } catch (xhrError) {
            console.error('[ChatWidget] Error sending sync XHR:', xhrError);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeChatId, apiBaseUrl]);

  // Watch for new errors and auto-open dialog
  useEffect(() => {
    if (hasUnhandledError && latestError) {
      const errorId = `${latestError.timestamp}-${latestError.message}`;
      
      // Check if this error has already been handled
      if (handledErrorRef.current === errorId) {
        return;
      }

      console.log("[ChatWidget] Auto-opening due to detected error:", latestError);
      
      // Mark this error as handled
      handledErrorRef.current = errorId;
      
      // Format and set the error context
      const formattedError = formatErrorContext(latestError);
      setInitialErrorContext(formattedError);
      
      // Auto-open the dialog
      setIsOpen(true);
      setAutoOpenedDueToError(true);
    }
  }, [hasUnhandledError, latestError]);

  const handleChatCreated = (chatId: number) => {
    setActiveChatId(chatId);
    
    // If this chat was created with error context, clear the error
    if (autoOpenedDueToError && hasUnhandledError) {
      console.log("[ChatWidget] Clearing error after chat creation");
      clearError();
    }
  };

  // Calculate unread count from new admin/ai messages
  useEffect(() => {
    if (!activeChatId || isOpen || !chatData?.messages) {
      return;
    }

    // Count only admin/ai messages
    const adminAiMessages = chatData.messages.filter(
      (msg: Selectable<Messages>) => msg.sender === 'admin' || msg.sender === 'ai'
    );
    const totalAdminAiCount = adminAiMessages.length;
    const newUnreadCount = Math.max(0, totalAdminAiCount - lastSeenMessageCount);
    
    setUnreadCount(newUnreadCount);

    // Play sound if unread count increased
    if (newUnreadCount > previousUnreadCountRef.current && newUnreadCount > 0) {
      console.log('[ChatWidget] New unread messages detected, playing notification sound');
      notificationAudio.play().catch((error) => {
        console.warn('Could not play notification sound:', error);
      });
    }

    previousUnreadCountRef.current = newUnreadCount;
  }, [activeChatId, isOpen, chatData?.messages, lastSeenMessageCount, notificationAudio]);

  const handleToggleOpen = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    onOpenChange?.(newOpenState);

    if (newOpenState) {
      // When opening, update last seen count and reset unread count
      if (chatData?.messages && activeChatId) {
        const adminAiMessages = chatData.messages.filter(
          (msg: Selectable<Messages>) => msg.sender === 'admin' || msg.sender === 'ai'
        );
        const newCount = adminAiMessages.length;
        setLastSeenMessageCount(newCount);
        setUnreadCount(0);
        previousUnreadCountRef.current = 0;
        
        // Save to localStorage
        localStorage.setItem(`chatWidget_lastSeen_${activeChatId}`, newCount.toString());
        console.log(`[ChatWidget] Saved lastSeenMessageCount to localStorage for chat ${activeChatId}:`, newCount);
      }
    }

    if (!newOpenState) {
      if (activeChatId) {
        checkAndSendEmailNotification(activeChatId)
          .catch((error) => {
            console.error("Error checking/sending email notification:", error);
          });
      }
      // Reset error-related states, but keep activeChatId to preserve the chat session
      setAutoOpenedDueToError(false);
      setInitialErrorContext(undefined);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);

    // Update last seen count and reset unread count when closing
    if (chatData?.messages && activeChatId) {
      const adminAiMessages = chatData.messages.filter(
        (msg: Selectable<Messages>) => msg.sender === 'admin' || msg.sender === 'ai'
      );
      const newCount = adminAiMessages.length;
      setLastSeenMessageCount(newCount);
      setUnreadCount(0);
      previousUnreadCountRef.current = 0;
      
      // Save to localStorage
      localStorage.setItem(`chatWidget_lastSeen_${activeChatId}`, newCount.toString());
      console.log(`[ChatWidget] Saved lastSeenMessageCount to localStorage for chat ${activeChatId}:`, newCount);
    }
    if (activeChatId) {
      checkAndSendEmailNotification(activeChatId)
        .catch((error) => {
          console.error("Error checking/sending email notification:", error);
        });
    }
    // Reset error-related states, but keep activeChatId to preserve the chat session
    setAutoOpenedDueToError(false);
    setInitialErrorContext(undefined);
  };

  const effectivePrimaryColor = primaryColor || '#dc1928';
  const cssVariables: CSSProperties = {
    ['--primary' as string]: effectivePrimaryColor,
    ['--primary-foreground' as string]: 'white',
  };

  const positionClass = isEmbedded 
    ? styles.chatWindowEmbedded
    : widgetPosition === 'bottom-left' 
      ? styles.chatWindowLeft 
      : styles.chatWindowRight;

  const buttonPositionClass = isEmbedded
    ? styles.floatingButtonEmbedded
    : widgetPosition === 'bottom-left' 
      ? styles.floatingButtonLeft 
      : styles.floatingButtonRight;

  const shouldShowContactForm = !hideContactForm || !activeChatId;

  return (
    <>
      {(!isEmbedded || !isOpen) && (
        <div className={`${styles.floatingButtonContainer} ${isEmbedded ? styles.floatingButtonContainerEmbedded : ''}`}>
          <Button 
            className={`${styles.floatingButton} ${buttonPositionClass}`}
            size="icon-lg"
            style={cssVariables}
            onClick={handleToggleOpen}
          >
            <MessageSquare />
          </Button>
          {unreadCount > 0 && (
            <div className={`${styles.unreadBadge} ${buttonPositionClass === styles.floatingButtonLeft ? styles.unreadBadgeLeft : styles.unreadBadgeRight}`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      )}

      {(!isEmbedded || isOpen) && (
        <div 
          className={`${styles.chatWindow} ${positionClass} ${isOpen ? styles.chatWindowOpen : styles.chatWindowClosed}`}
          style={cssVariables}
        >
        <div className={`${styles.chatHeader} ${isEmbedded ? styles.chatHeaderEmbedded : ''}`}>
          <div className={styles.chatHeaderContent}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.chatAvatar}>
                {agentImageUrl ? (
                  <img src={agentImageUrl} alt={agentName} className={styles.avatarImage} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {agentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className={styles.chatTitleWrapper}>
                <h2 className={styles.chatTitle}>Australia Post All Chat Support</h2>
                <div className={styles.chatSubtitle}>
                  <div className={styles.statusIndicator}></div>
                  <span>Online now</span>
                </div>
              </div>
            </div>
            <div className={styles.chatHeaderActions}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                title="Minimize chat"
                className={styles.headerButton}
              >
                <Minus size={16} />
              </Button>
            </div>
          </div>
          {!activeChatId && shouldShowContactForm && (
            <p className={`${styles.chatDescription} ${isEmbedded ? styles.chatDescriptionEmbedded : ''}`}>
              Fill in your details below to start a conversation with our
              support team.
            </p>
          )}
          
        </div>

        <div className={`${styles.chatContent} ${isEmbedded ? styles.chatContentEmbedded : ''}`}>
          {activeChatId ? (
            <ChatView 
              chatId={activeChatId}
              agentName={agentName}
              agentImageUrl={agentImageUrl}
              isAdmin={isAdmin}
            />
          ) : shouldShowContactForm ? (
            <NewChatForm
              onChatCreated={handleChatCreated}
              isCreating={createChatMutation.isPending}
              initialErrorContext={initialErrorContext}
              autoOpened={autoOpenedDueToError}
              initialValues={{
                merchantEmail,
                shopName,
                shopDomain,
              }}
            />
          ) : (
            <div className={styles.loadingContainer}>
              <p>Creating your chat session...</p>
            </div>
          )}
        </div>
        </div>
      )}

      {!isEmbedded && isOpen && <div className={styles.overlay} onClick={handleClose} />}
    </>
  );
};