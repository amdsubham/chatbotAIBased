import React, { useState, useRef, useEffect, useMemo } from "react";
import { Bot } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSendMessageMutation } from "../helpers/useSendMessageMutation";
import { useAiGenerateResponseMutation } from "../helpers/useAiGenerateResponseMutation";
import { useSettingsQuery } from "../helpers/useSettingsQuery";
import { useChatQuery } from "../helpers/useChatQuery";
import { useUpdateTypingMutation } from "../helpers/useUpdateTypingMutation";
import { useTypingStatusQuery } from "../helpers/useTypingStatusQuery";
import { useMarkMessagesViewedMutation } from "../helpers/useMarkMessagesViewedMutation";
import { TypingIndicator } from "./TypingIndicator";
import { Avatar, AvatarFallback } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { MessageBubble } from "./MessageBubble";
import { ChatHeader } from "./ChatHeader";
import { ChatRatingInterface } from "./ChatRatingInterface";
import { ChatMessageInput } from "./ChatMessageInput";
import styles from "./ChatView.module.css";

export interface ChatViewProps {
  chatId: number;
  onClose?: () => void;
  agentName?: string;
  agentImageUrl?: string;
  isAdmin?: boolean;
}

export const ChatView = ({ chatId, onClose, agentName, agentImageUrl, isAdmin = false }: ChatViewProps) => {
  const queryClient = useQueryClient();
  const { data: chat, isFetching, error } = useChatQuery(
    { chatId },
    { enabled: !!chatId },
  );
  const { data: settings } = useSettingsQuery();
  const sendMessageMutation = useSendMessageMutation();
  const aiGenerateResponseMutation = useAiGenerateResponseMutation();
  const updateTypingMutation = useUpdateTypingMutation();
  const markMessagesViewedMutation = useMarkMessagesViewedMutation();
  const { data: typingStatus } = useTypingStatusQuery({
    chatId,
    expirationSeconds: 5,
    enabled: !!chatId,
  });
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isWaitingForAiResponse, setIsWaitingForAiResponse] = useState(false);
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasMarkedViewedRef = useRef<Set<number>>(new Set());
  const lastTypingUpdateRef = useRef<number>(0);
  const lastMessageIdRef = useRef<number | null>(null);
  const previousMessageCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  
  // Create audio instance for notification sound
  const notificationAudio = useMemo(() => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audio.volume = 0.9;
    return audio;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when component first loads with messages
  useEffect(() => {
    if (chat?.messages && chat.messages.length > 0 && isInitialLoadRef.current) {
      // Use setTimeout to ensure DOM has fully rendered
      setTimeout(() => {
        // Force instant scroll on initial load
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        // Mark initial load as complete
        isInitialLoadRef.current = false;
      }, 200);
    }
  }, [chat?.messages]);

  const isAdminTyping = typingStatus?.some(
    (status) => status.typerType === "admin"
  );

  // Attach scroll listener to detect when user scrolls up/down
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // If user has scrolled more than 80px from bottom, lock auto-scroll
      if (distanceFromBottom > 80) {
        setIsAutoScrollLocked(true);
      } else {
        setIsAutoScrollLocked(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect when we should be waiting for a server-side AI response
  useEffect(() => {
    if (!chat?.messages || chat.messages.length === 0) {
      setIsWaitingForAiResponse(false);
      return;
    }

    // Get the last message
    const lastMessage = chat.messages[chat.messages.length - 1];
    
    // Check if AI is enabled for this chat
    const effectiveAiEnabled = chat.aiAutoResponseEnabled ?? settings?.autoAiResponseEnabled ?? false;
    
    // If the last message is from user and AI is enabled, we should be waiting
    if (lastMessage.sender === "user" && effectiveAiEnabled) {
      console.log("[ChatView] Detected user message with AI enabled - waiting for AI response");
      setIsWaitingForAiResponse(true);
    } else if (lastMessage.sender === "ai" || lastMessage.sender === "admin") {
      // If the last message is from AI/admin, we're no longer waiting
      if (isWaitingForAiResponse) {
        console.log("[ChatView] AI/admin response received - clearing waiting state");
      }
      setIsWaitingForAiResponse(false);
    }
  }, [chat?.messages, chat?.aiAutoResponseEnabled, settings?.autoAiResponseEnabled, isWaitingForAiResponse]);

  // Play notification sound for new admin/AI messages
  useEffect(() => {
    if (!chat?.messages || chat.messages.length === 0) return;
    
    const currentMessageCount = chat.messages.length;
    
    // Skip on initial load - just set the baseline
    if (isInitialLoadRef.current) {
      previousMessageCountRef.current = currentMessageCount;
      isInitialLoadRef.current = false;
      return;
    }
    
    // Check if there are new messages
    if (currentMessageCount > previousMessageCountRef.current) {
      const newMessagesCount = currentMessageCount - previousMessageCountRef.current;
      
      // Check the newest message(s) - typically just 1, but could be multiple in edge cases
      for (let i = 0; i < newMessagesCount; i++) {
        const newMessage = chat.messages[currentMessageCount - 1 - i];
        
        // Play sound only for admin or AI messages (not user messages)
        if (newMessage.sender === "admin" || newMessage.sender === "ai") {
          console.log(`Playing notification sound for new ${newMessage.sender} message`);
          
          // Play the notification sound with error handling
          notificationAudio.play().catch((error) => {
            // Browser might block autoplay - log but don't crash
            console.warn("Could not play notification sound:", error);
          });
          
          // Only play sound once even if multiple new messages
          break;
        }
      }
      
      previousMessageCountRef.current = currentMessageCount;
    }
  }, [chat?.messages, notificationAudio]);

  // Smart auto-scroll: only scroll when there are NEW messages and user hasn't scrolled up
  useEffect(() => {
    if (!chat?.messages || chat.messages.length === 0) return;

    const latestMessageId = chat.messages[chat.messages.length - 1].id;
    const hasNewMessage = lastMessageIdRef.current !== null && lastMessageIdRef.current !== latestMessageId;

    // Only auto-scroll if there's a new message and auto-scroll is not locked
    if (hasNewMessage && !isAutoScrollLocked) {
      scrollToBottom();
    }

    // Update the last message ID
    lastMessageIdRef.current = latestMessageId;
  }, [chat?.messages, isAutoScrollLocked]);

  // Mark messages as viewed when component mounts - ONCE per chatId
  useEffect(() => {
    if (chatId && !hasMarkedViewedRef.current.has(chatId)) {
      console.log(`Marking messages as viewed for chat ${chatId} on mount`);
      markMessagesViewedMutation.mutate({ chatId });
      hasMarkedViewedRef.current.add(chatId);
    }
  }, [chatId]);

  // Mark messages as viewed when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && chatId) {
        console.log(`Marking messages as viewed for chat ${chatId} on visibility change`);
        markMessagesViewedMutation.mutate({ chatId });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId]);

  const handleTypingUpdate = () => {
    const now = Date.now();
    if (now - lastTypingUpdateRef.current >= 2000) {
      updateTypingMutation.mutate({
        chatId,
        typerType: "user",
      });
      lastTypingUpdateRef.current = now;
    }
  };

  const handleSendMessage = async (message: string, imageUrl: string | null) => {
    try {
      await sendMessageMutation.mutateAsync({
        chatId,
        sender: "user",
        content: message,
        imageUrl,
      });

      // Always scroll when the user sends a message
      scrollToBottom();

      // Determine effective AI setting for this chat
      console.log('[ChatView] DEBUG - Raw chat data (aiAutoResponseEnabled):', {
        value: chat?.aiAutoResponseEnabled,
        type: typeof chat?.aiAutoResponseEnabled,
        isNull: chat?.aiAutoResponseEnabled === null,
        isUndefined: chat?.aiAutoResponseEnabled === undefined,
        stringifiedValue: JSON.stringify(chat?.aiAutoResponseEnabled)
      });

      console.log('[ChatView] DEBUG - Raw settings data (autoAiResponseEnabled):', {
        value: settings?.autoAiResponseEnabled,
        type: typeof settings?.autoAiResponseEnabled,
        isNull: settings?.autoAiResponseEnabled === null,
        isUndefined: settings?.autoAiResponseEnabled === undefined,
        stringifiedValue: JSON.stringify(settings?.autoAiResponseEnabled)
      });

      const effectiveAiEnabled = chat?.aiAutoResponseEnabled ?? settings?.autoAiResponseEnabled ?? false;

      console.log('[ChatView] DEBUG - Effective AI enabled after nullish coalescing:', {
        value: effectiveAiEnabled,
        type: typeof effectiveAiEnabled,
        stringifiedValue: JSON.stringify(effectiveAiEnabled)
      });

      const shouldTriggerAi = effectiveAiEnabled;

      console.log('[ChatView] DEBUG - shouldTriggerAi value:', {
        value: shouldTriggerAi,
        type: typeof shouldTriggerAi,
        stringifiedValue: JSON.stringify(shouldTriggerAi)
      });

      console.log('[ChatView] AI auto-response decision:', {
        chatLevelSetting: chat?.aiAutoResponseEnabled,
        globalSetting: settings?.autoAiResponseEnabled,
        effectiveSetting: effectiveAiEnabled,
        shouldTriggerAi,
        reason: effectiveAiEnabled ? 'AI auto-response is enabled' : 'AI auto-response is disabled'
      });

      if (shouldTriggerAi) {
        console.log("[ChatView] DEBUG - AI IS BEING TRIGGERED - User message sent, triggering AI response...");

        setIsAiGenerating(true);
        
        const previousMessages = chat?.messages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
        })) || [];

        const stream = await aiGenerateResponseMutation.mutateAsync({
          chatId,
          userMessage: message,
          userImageUrl: imageUrl,
          errorContext: chat?.errorContext,
          previousMessages,
        });

        if (stream) {
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              console.log("Received AI response chunk:", chunk);
            }
            console.log("AI response streaming completed");
            
            // Invalidate queries after stream completes to ensure AI message is in DB
            await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
            await queryClient.invalidateQueries({ queryKey: ["chats"] });
          } catch (streamError) {
            console.error("Error reading AI response stream:", streamError);
          } finally {
            reader.releaseLock();
          }
        }
      } else {
        console.log("[ChatView] DEBUG - AI IS BEING SKIPPED - AI auto-response is disabled", {
          chatLevelSetting: chat?.aiAutoResponseEnabled,
          globalSetting: settings?.autoAiResponseEnabled,
          effectiveSetting: effectiveAiEnabled,
          shouldTriggerAi
        });
      }
    } catch (err) {
      console.error("Failed to send message or generate AI response:", err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const shouldShowRatingInterface = 
    chat?.status === 'resolved' && 
    chat?.rating === null;

  if (isFetching && !chat) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.messageList}>
          <Skeleton className={styles.skeletonBubble} />
          <Skeleton className={`${styles.skeletonBubble} ${styles.skeletonRight}`} />
        <Skeleton className={styles.skeletonBubble} />
      </div>
      <Skeleton className={styles.skeletonInput} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.chatContainer}>
        <p className={styles.errorText}>
          Error loading chat. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <ChatHeader
        chatId={chatId}
        onClose={onClose}
        isAdmin={isAdmin}
        aiAutoResponseEnabled={chat?.aiAutoResponseEnabled ?? null}
        globalAiAutoResponseEnabled={settings?.autoAiResponseEnabled}
      />
      <div className={styles.messageList} ref={messagesContainerRef}>
        {chat?.messages.length === 0 && (
          <div className={`${styles.messageRow} ${styles.agentMessageRow}`}>
            <Avatar>
              <AvatarFallback className={styles.aiAvatar}>
                <Bot size={20} />
              </AvatarFallback>
            </Avatar>
            <div className={styles.messageContent}>
              <div className={styles.senderName}>{settings?.aiAgentName ?? 'AI'}</div>
              <div className={`${styles.messageBubble} ${styles.agentMessageBubble}`}>
                Hi there! 👋 Welcome to our support chat. I'm here to help you with any questions or issues you might have. Feel free to ask me anything!
              </div>
            </div>
          </div>
        )}
        {chat?.messages.map((msg, index) => {
          // Find the previous user message for the knowledge base feature
          let previousUserMessage: string | undefined;
          if ((msg.sender === "ai" || msg.sender === "admin") && isAdmin) {
            for (let i = index - 1; i >= 0; i--) {
              if (chat.messages[i].sender === "user") {
                previousUserMessage = chat.messages[i].content;
                break;
              }
            }
          }
          
          return (
            <MessageBubble 
              key={msg.id} 
              message={msg}
              agentName={agentName}
              agentImageUrl={agentImageUrl}
              isAdmin={isAdmin}
              previousUserMessage={previousUserMessage}
              aiAgentName={settings?.aiAgentName ?? undefined}
              adminAgentName={settings?.adminAgentName ?? undefined}
              chatId={chatId}
            />
          );
        })}
        {(isAiGenerating || isWaitingForAiResponse) && (
          <div className={`${styles.messageRow} ${styles.agentMessageRow}`}>
            <Avatar>
              <AvatarFallback className={styles.aiAvatar}>
                <Bot size={20} />
              </AvatarFallback>
            </Avatar>
            <div className={styles.messageContent}>
              <div className={styles.senderName}>{settings?.aiAgentName ?? 'AI'}</div>
              <div className={`${styles.messageBubble} ${styles.agentMessageBubble}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        {isAdminTyping && (
          <TypingIndicator sender="Support Admin" variant="agent" />
        )}
        <div ref={messagesEndRef} />
      </div>
      {shouldShowRatingInterface ? (
        <ChatRatingInterface chatId={chatId} />
      ) : (
        <ChatMessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTypingUpdate}
          disabled={sendMessageMutation.isPending}
        />
      )}
    </div>
  );
};