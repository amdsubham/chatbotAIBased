import React, { useState } from "react";
import { Bot, User, UserCog, BookmarkPlus, Download, Mail, Headphones } from "lucide-react";
import { Selectable } from "kysely";
import { Messages } from "../helpers/schema";
import { Avatar, AvatarFallback } from "./Avatar";
import { Button } from "./Button";
import { SaveToKnowledgeBaseDialog } from "./SaveToKnowledgeBaseDialog";
import { parseMarkdown } from "../helpers/parseMarkdown";
import { openImageInNewTab } from "../helpers/openImageInNewTab";
import { useSendMessageToUserEmailMutation } from "../helpers/useSendMessageToUserEmailMutation";
import { useSendMessageMutation } from "../helpers/useSendMessageMutation";
import styles from "./MessageBubble.module.css";

export interface MessageBubbleProps {
  message: Selectable<Messages>;
  className?: string;
  agentName?: string;
  agentImageUrl?: string;
  isAdmin?: boolean;
  previousUserMessage?: string;
  aiAgentName?: string;
  adminAgentName?: string;
  chatId: number;
}

export const MessageBubble = ({ 
  message, 
  className, 
  agentName, 
  agentImageUrl,
  isAdmin = false,
  previousUserMessage,
  aiAgentName,
  adminAgentName,
  chatId,
}: MessageBubbleProps) => {
  const isUser = message.sender === "user";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [agentRequestSent, setAgentRequestSent] = useState(false);
  const sendEmailMutation = useSendMessageToUserEmailMutation();
  const sendMessageMutation = useSendMessageMutation();
  
  // Use custom agent name for admin messages if provided, otherwise use "Admin"
  const senderName = 
    message.sender === "admin" 
      ? (adminAgentName || agentName || "Subham Routray")
      : message.sender === "ai"
      ? (aiAgentName || "Support Agent")
      : message.sender.charAt(0).toUpperCase() + message.sender.slice(1);

  const handleImageClick = () => {
    if (message.imageUrl) {
      openImageInNewTab(message.imageUrl);
    }
  };

  const handleImageDownload = async () => {
    if (!message.imageUrl) return;
    
    try {
      const response = await fetch(message.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${message.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleSaveToKnowledge = () => {
    setDialogOpen(true);
  };

  const handleSendEmail = () => {
    sendEmailMutation.mutate({ messageId: message.id });
  };

  const handleTalkWithAgent = async () => {
    if (agentRequestSent) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        chatId,
        sender: 'ai',
        content: 'Thank you for your request. Please wait for some time. Our Support team will reach out to you soon.',
      });
      setAgentRequestSent(true);
    } catch (error) {
      console.error('Failed to send agent request:', error);
    }
  };

  const canSaveToKnowledge = 
    isAdmin && 
    !isUser && 
    (message.sender === "ai" || message.sender === "admin") &&
    previousUserMessage;

  const canSendEmail = 
    isAdmin && 
    !isUser && 
    (message.sender === "ai" || message.sender === "admin");

  const getAvatar = () => {
    switch (message.sender) {
      case "user":
        return (
          <Avatar>
            <AvatarFallback>
              <User size={20} />
            </AvatarFallback>
          </Avatar>
        );
      case "ai":
        return (
          <Avatar>
            <AvatarFallback className={styles.aiAvatar}>
              <Bot size={20} />
            </AvatarFallback>
          </Avatar>
        );
      case "admin":
        return agentImageUrl ? (
          <Avatar>
            <img 
              src={agentImageUrl} 
              alt={agentName || "Admin"} 
              className={styles.avatarImage}
            />
          </Avatar>
        ) : (
          <Avatar>
            <AvatarFallback className={styles.adminAvatar}>
              <UserCog size={20} />
            </AvatarFallback>
          </Avatar>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={`${styles.messageRow} ${isUser ? styles.userMessageRow : styles.agentMessageRow} ${className || ''}`}
      >
        {!isUser && getAvatar()}
        <div className={styles.messageContent}>
          {(message.sender === "admin" || message.sender === "ai") && <div className={styles.senderName}>{senderName}</div>}
          <div className={styles.messageBubbleWrapper}>
            <div
              className={`${styles.messageBubble} ${isUser ? styles.userMessageBubble : styles.agentMessageBubble}`}
            >
              {parseMarkdown(message.content)}
              {message.imageUrl && (
                <div className={styles.imageContainer}>
                  <img
                    src={message.imageUrl}
                    alt="Attached image"
                    className={styles.messageImage}
                    onClick={handleImageClick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleImageClick();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Click to open in new tab"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageDownload();
                    }}
                    className={styles.downloadButton}
                    title="Download image"
                  >
                    <Download size={14} />
                    Download
                  </Button>
                </div>
              )}
            </div>
            <div className={styles.actionButtons}>
              {canSendEmail && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSendEmail}
                  className={styles.emailButton}
                  title="Send via Email"
                  disabled={sendEmailMutation.isPending}
                >
                  <Mail size={14} />
                </Button>
              )}
              {canSaveToKnowledge && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSaveToKnowledge}
                  className={styles.saveButton}
                  title="Save to Knowledge Base"
                >
                  <BookmarkPlus size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>
        {isUser && getAvatar()}
      </div>
      {canSaveToKnowledge && previousUserMessage && (
        <SaveToKnowledgeBaseDialog
          question={previousUserMessage}
          answer={message.content}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
      {message.sender === 'ai' && message.content !== 'Thank you for your request. Please wait for some time. Our Support team will reach out to you soon.' && (
        <div className={styles.talkWithAgentContainer}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleTalkWithAgent}
            disabled={agentRequestSent || sendMessageMutation.isPending}
            className={styles.talkWithAgentButton}
          >
            <Headphones size={16} />
            {agentRequestSent ? 'Request Sent' : 'Talk with Support Team'}
          </Button>
        </div>
      )}
    </>
  );
};