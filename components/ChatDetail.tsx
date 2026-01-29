import React, { useState, useRef, useEffect } from "react";
import { useChatQuery } from "../helpers/useChatQuery";
import { useSendMessageMutation } from "../helpers/useSendMessageMutation";
import { useUpdateChatStatusMutation } from "../helpers/useUpdateChatStatusMutation";
import { useChatExportMutation } from "../helpers/useChatExportMutation";
import { useUpdateTypingMutation } from "../helpers/useUpdateTypingMutation";
import { useTypingStatusQuery } from "../helpers/useTypingStatusQuery";
import { useSendEmailNotificationMutation } from "../helpers/useSendEmailNotificationMutation";
import { useDeleteChatMutation } from "../helpers/useDeleteChatMutation";
import { useDeleteMessageMutation } from "../helpers/useDeleteMessageMutation";
import { useSendMessageToUserEmailMutation } from "../helpers/useSendMessageToUserEmailMutation";
import { useMarkMessagesViewedMutation } from "../helpers/useMarkMessagesViewedMutation";

import { Skeleton } from "./Skeleton";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { Avatar, AvatarFallback } from "./Avatar";
import { Send, AlertCircle, Paperclip, X, Star, ChevronUp, Mail, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import { openImageInNewTab } from "../helpers/openImageInNewTab";
import { TypingIndicator } from "./TypingIndicator";
import { ReplySuggestionsPanel } from "./ReplySuggestionsPanel";
import { ChatDetailHeader } from "./ChatDetailHeader";
import { MerchantDetailsPanel } from "./MerchantDetailsPanel";
import { useMerchantUserByEmail } from "../helpers/useMerchantUsersQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
import styles from "./ChatDetail.module.css";

interface ChatDetailProps {
  chatId: number;
  onClose: () => void;
}

interface SelectedImage {
  file: File;
  dataUrl: string;
  name: string;
  size: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ChatDetail = ({ chatId, onClose }: ChatDetailProps) => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: number; chatId: number } | null>(null);
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(false);
  const [showMerchantDetails, setShowMerchantDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  const { data: chat, isLoading, isFetching, error, refetch } = useChatQuery({ chatId }, { enabled: !!chatId });
  const sendMessageMutation = useSendMessageMutation();
  const updateStatusMutation = useUpdateChatStatusMutation();
  const exportMutation = useChatExportMutation();
  const sendEmailNotificationMutation = useSendEmailNotificationMutation();
  const deleteChatMutation = useDeleteChatMutation({
    onSuccess: () => {
      onClose();
    },
  });
  const deleteMessageMutation = useDeleteMessageMutation();
  const sendMessageToUserEmailMutation = useSendMessageToUserEmailMutation();
  const markMessagesViewedMutation = useMarkMessagesViewedMutation();
  const updateTypingMutation = useUpdateTypingMutation();
  const { data: typingStatus } = useTypingStatusQuery({
    chatId,
    expirationSeconds: 5,
    enabled: !!chatId,
  });
  const { data: merchantUser, isLoading: merchantUserLoading } = useMerchantUserByEmail(chat?.merchantEmail);
  const lastTypingUpdateRef = useRef<number>(0);
  const hasMarkedViewedRef = useRef<boolean>(false);

  // Reset the viewed flag when chatId changes
  useEffect(() => {
    hasMarkedViewedRef.current = false;
  }, [chatId]);

  // Mark messages as viewed when chat is opened or new messages arrive
  useEffect(() => {
    if (!chat?.messages || chat.messages.length === 0) return;
    if (hasMarkedViewedRef.current) return;

    // Check if there are any unread messages
    const hasUnreadMessages = chat.messages.some(
      (msg) => msg.viewedAt === null && msg.sender !== "admin"
    );

    if (hasUnreadMessages) {
      console.log(`Marking messages as viewed for chat ${chatId}`);
      hasMarkedViewedRef.current = true;
      markMessagesViewedMutation.mutate({ chatId });
    }
  }, [chat?.messages, chatId]);

  // Helper function to check if a message should show "Send via Email" button
  const shouldShowEmailButton = (messageId: number, messageSender: string): boolean => {
    if (!chat?.messages) return false;
    if (messageSender !== "admin" && messageSender !== "ai") return false;
    
    const messageIndex = chat.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return false;
    
    // Check if there are any user messages after this message
    const messagesAfter = chat.messages.slice(messageIndex + 1);
    const hasUserReplyAfter = messagesAfter.some(msg => msg.sender === "user");
    
    return !hasUserReplyAfter;
  };

  const handleSendMessageViaEmail = (messageId: number) => {
    sendMessageToUserEmailMutation.mutate({ messageId });
  };

  // Check if user is typing
  const isUserTyping = typingStatus?.some(
    (status) => status.typerType === "user"
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initial scroll to bottom on first load
  useEffect(() => {
    if (chat?.messages && chat.messages.length > 0 && isInitialLoadRef.current) {
      // Force immediate scroll to bottom on initial load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        isInitialLoadRef.current = false;
      }, 200);
    }
  }, [chat?.messages]);

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

  const handleTypingUpdate = () => {
    const now = Date.now();
    // Throttle: only update if 2 seconds have passed since last update
    if (now - lastTypingUpdateRef.current >= 2000) {
      updateTypingMutation.mutate({
        chatId,
        typerType: "admin",
      });
      lastTypingUpdateRef.current = now;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage({
        file,
        dataUrl,
        name: file.name,
        size: file.size,
      });
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
    };
    reader.readAsDataURL(file);

    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setUploadError(null);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedImage) return;

    sendMessageMutation.mutate(
      {
        chatId,
        sender: "admin",
        content: message.trim() || "(Image attached)",
        imageUrl: selectedImage?.dataUrl || null,
      },
      {
        onSuccess: () => {
          setMessage("");
          setSelectedImage(null);
          setUploadError(null);
          // Always scroll when the admin sends a message
          scrollToBottom();
        },
      }
    );
  };

  const handleSelectReply = (reply: string) => {
    setMessage(reply);
    setShowSuggestions(false);
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
  };

  const handleToggleSuggestions = () => {
    setShowSuggestions(true);
  };

  const handleDeleteChat = () => {
    deleteChatMutation.mutate({ chatId });
    setShowDeleteConfirm(false);
  };

  const handleDeleteMessage = () => {
    if (!messageToDelete) return;
    deleteMessageMutation.mutate(
      {
        messageId: messageToDelete.id,
        chatId: messageToDelete.chatId,
      },
      {
        onSuccess: () => {
          setMessageToDelete(null);
        },
      }
    );
  };

  // Check if chat has user messages but no admin messages (unanswered)
  const hasUserMessages = chat?.messages.some((msg) => msg.sender === "user");
  const hasAdminMessages = chat?.messages.some((msg) => msg.sender === "admin");
  const isUnanswered = hasUserMessages && !hasAdminMessages;

  if (isLoading && !chat) return <ChatDetailSkeleton />;
  if (error) return <div className={styles.errorState}>Error: {error.message}</div>;
  if (!chat) return <div className={styles.errorState}>Chat not found.</div>;

  return (
    <div className={styles.container}>
      <ChatDetailHeader
        chat={{
          id: chat.id,
          merchantEmail: chat.merchantEmail,
          shopName: chat.shopName,
          status: chat.status,
          emailNotificationSent: chat.emailNotificationSent,
          aiAutoResponseEnabled: chat.aiAutoResponseEnabled,
        }}
        isUnanswered={!!isUnanswered}
        isFetching={isFetching}
        exportPending={exportMutation.isPending}
        sendEmailPending={sendEmailNotificationMutation.isPending}
        deletePending={deleteChatMutation.isPending}
        updateStatusPending={updateStatusMutation.isPending}
        onClose={onClose}
        onRefetch={() => refetch()}
        onDelete={() => setShowDeleteConfirm(true)}
        onUpdateStatus={(status) => updateStatusMutation.mutate({ chatId, status })}
        onExport={(format) => exportMutation.mutate({ chatId, format })}
        onSendEmailReminder={() => sendEmailNotificationMutation.mutate({ chatId })}
        onExpandDetails={() => setShowMerchantDetails(true)}
      />

      {chat.rating !== null && (
        <div className={styles.ratingSection}>
          <div className={styles.ratingCard}>
            <div className={styles.ratingHeader}>
              <div className={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    className={star <= (chat.rating || 0) ? styles.starFilled : styles.starOutline}
                    fill={star <= (chat.rating || 0) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className={styles.ratingTimestamp}>
                Rated on {new Date(chat.ratedAt || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {chat.feedbackText ? (
              <p className={styles.feedbackText}>{chat.feedbackText}</p>
            ) : (
              <p className={styles.feedbackTextEmpty}>No additional feedback provided</p>
            )}
          </div>
        </div>
      )}

      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {chat.errorContext && (
          <div className={`${styles.messageBubble} ${styles.system}`}>
            <AlertCircle size={16} />
            <div>
              <strong>Error Context:</strong>
              <pre className={styles.errorCode}>{chat.errorContext}</pre>
            </div>
          </div>
        )}
        {chat.messages.map((msg) => (
          <div key={msg.id} className={`${styles.messageWrapper} ${styles[msg.sender]}`}>
            {msg.sender === "ai" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className={styles.avatar}>
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>Primecaves Agent</TooltipContent>
              </Tooltip>
            ) : msg.sender === "admin" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className={styles.avatar}>
                    <img 
                      src="https://allinonelabels.s3.ap-southeast-2.amazonaws.com/images/SubhamR.png" 
                      alt="Subham Routray"
                      className={styles.avatarImage}
                    />
                    <AvatarFallback>SR</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>Subham Routray</TooltipContent>
              </Tooltip>
            ) : (
              <Avatar className={styles.avatar}>
                <AvatarFallback>{msg.sender.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div className={`${styles.messageBubble} ${styles[`bubble-${msg.sender}`]}`}>
              <p>{msg.content}</p>
              {msg.imageUrl && (
                <img 
                  src={msg.imageUrl} 
                  alt="User upload" 
                  className={styles.imageUpload} 
                  onClick={() => openImageInNewTab(msg.imageUrl!)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openImageInNewTab(msg.imageUrl!);
                    }
                  }}
                />
              )}
              <div className={styles.messageFooter}>
                <span className={styles.messageTimestamp}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
                <div className={styles.messageActions}>
                  {shouldShowEmailButton(msg.id, msg.sender) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSendMessageViaEmail(msg.id)}
                          disabled={sendMessageToUserEmailMutation.isPending}
                          className={styles.emailButton}
                          aria-label="Send this message via email"
                        >
                          <Mail size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Send via email</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setMessageToDelete({ id: msg.id, chatId })}
                        disabled={deleteMessageMutation.isPending}
                        className={styles.deleteButton}
                        aria-label="Delete this message"
                      >
                        <Trash2 size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete message</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isUserTyping && (
          <TypingIndicator 
            sender={chat.merchantEmail} 
            variant="user" 
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && (
        <ReplySuggestionsPanel
          chatId={chatId}
          currentDraft={message}
          onSelectReply={handleSelectReply}
          onClose={handleCloseSuggestions}
          className={styles.suggestionsPanel}
        />
      )}

      <form className={styles.inputForm} onSubmit={handleSendMessage}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className={styles.hiddenFileInput}
        />
        
        <div className={styles.inputWrapper}>
          {selectedImage && (
            <div className={styles.imagePreview}>
              <img src={selectedImage.dataUrl} alt="Preview" className={styles.previewThumbnail} />
              <div className={styles.previewInfo}>
                <span className={styles.previewName}>{selectedImage.name}</span>
                <span className={styles.previewSize}>{formatFileSize(selectedImage.size)}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleRemoveImage}
                className={styles.removeButton}
              >
                <X size={16} />
              </Button>
            </div>
          )}
          
          {uploadError && (
            <div className={styles.uploadError}>
              <AlertCircle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
          
          <div className={styles.inputRow}>
            {!showSuggestions && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleToggleSuggestions}
                className={styles.suggestionsToggleButton}
              >
                <ChevronUp size={16} />
              </Button>
            )}
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) {
                  handleTypingUpdate();
                }
              }}
              placeholder="Type your reply..."
              className={styles.messageInput}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAttachClick}
              disabled={sendMessageMutation.isPending}
            >
              <Paperclip size={16} />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={sendMessageMutation.isPending || (!message.trim() && !selectedImage)}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
              All messages and associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={deleteChatMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteChat}
              disabled={deleteChatMutation.isPending}
            >
              {deleteChatMutation.isPending ? "Deleting..." : "Delete Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={deleteMessageMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteMessage}
              disabled={deleteMessageMutation.isPending}
            >
              {deleteMessageMutation.isPending ? "Deleting..." : "Delete Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showMerchantDetails && (
        <MerchantDetailsPanel
          user={merchantUser}
          isLoading={merchantUserLoading}
          onClose={() => setShowMerchantDetails(false)}
        />
      )}
    </div>
  );
};

const ChatDetailSkeleton = () => (
  <div className={styles.container}>
    <div className={styles.messagesContainer}>
      <div className={`${styles.messageWrapper} ${styles.user}`}>
        <Skeleton style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }} />
        <Skeleton style={{ height: '4rem', width: '60%', borderRadius: 'var(--radius)' }} />
      </div>
      <div className={`${styles.messageWrapper} ${styles.ai}`}>
        <Skeleton style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }} />
        <Skeleton style={{ height: '5rem', width: '70%', borderRadius: 'var(--radius)' }} />
      </div>
    </div>
    <div className={styles.inputForm}>
      <Skeleton style={{ height: '2.5rem', flex: 1 }} />
      <Skeleton style={{ height: '2.5rem', width: '2.5rem' }} />
    </div>
  </div>
);