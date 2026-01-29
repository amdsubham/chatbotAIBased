import { Badge } from "./Badge";
import { Checkbox } from "./Checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { AlertCircle, BotOff, Bot } from "lucide-react";
import { ChatStatus } from "../helpers/schema";
import styles from "./ChatListItem.module.css";

interface ChatListItemProps {
  chat: any;
  isSelected: boolean;
  isBulkSelected: boolean;
  onSelect: () => void;
  onBulkSelect: () => void;
}

export const ChatListItem = ({ 
  chat, 
  isSelected, 
  isBulkSelected, 
  onSelect, 
  onBulkSelect 
}: ChatListItemProps) => {
  const getStatusVariant = (status: ChatStatus) => {
    switch (status) {
      case "active": return "default";
      case "resolved": return "success";
      case "unresolved": return "warning";
      default: return "outline";
    }
  };

  const isWidgetOnline = (chat: any) => {
    // Check if merchant has been seen recently (within last 2 minutes)
    // This tracks page presence, not whether widget is open/minimized
    if (!chat.widgetLastSeenAt) {
      return false;
    }
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    const lastSeenTime = new Date(chat.widgetLastSeenAt).getTime();
    return lastSeenTime > twoMinutesAgo;
  };

  const needsAttentionIndicator = (chat: any) => {
    if (chat.status !== "active" && chat.status !== "unresolved") {
      return false;
    }
    if (!chat.lastUserMessageAt) {
      return false;
    }
    if (chat.hasAdminResponse) {
      return false;
    }
    if (chat.emailNotificationSent) {
      return false;
    }
    return true;
  };

  return (
    <div
      className={`${styles.chatItem} ${isSelected ? styles.selected : ""} ${chat.latestMessage?.sender === 'user' ? styles.needsResponse : ""} ${isBulkSelected ? styles.bulkSelected : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={styles.itemHeader}>
        <div className={styles.emailWithPresence}>
          <Checkbox
            checked={isBulkSelected}
            onChange={(e) => {
              e.stopPropagation();
              onBulkSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            className={styles.chatCheckbox}
            aria-label={`Select chat with ${chat.merchantEmail}`}
          />
          <span className={styles.email}>{chat.merchantEmail}</span>
          {isWidgetOnline(chat) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={styles.onlineIndicator} />
              </TooltipTrigger>
              <TooltipContent>User is currently online</TooltipContent>
            </Tooltip>
          )}
          {chat.aiAutoResponseEnabled === false && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={styles.aiOffIndicator}>
                  <BotOff size={14} />
                </div>
              </TooltipTrigger>
              <TooltipContent>AI auto-response is off</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className={styles.statusGroup}>
          {chat.unreadUserMessageCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className={styles.unreadBadge}>
                  {chat.unreadUserMessageCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Unread user messages</TooltipContent>
            </Tooltip>
          )}
          {chat.unreadAiAdminMessageCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className={styles.unreadAiBadge}>
                  <Bot size={12} className={styles.botIcon} />
                  {chat.unreadAiAdminMessageCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Unread AI/Admin responses</TooltipContent>
            </Tooltip>
          )}
          <Badge variant={getStatusVariant(chat.status)}>{chat.status}</Badge>
          {needsAttentionIndicator(chat) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={styles.attentionIndicator}>
                  <AlertCircle size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent>Needs response</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <p className={styles.shopInfo}>{chat.shopName || chat.shopDomain}</p>
      <p className={styles.latestMessage}>
        {chat.latestMessage?.content ? (
          <>
            <strong>{chat.latestMessage.sender}:</strong> {chat.latestMessage.content}
          </>
        ) : (
          <em>No messages yet</em>
        )}
      </p>
      <span className={styles.timestamp}>
        {new Date(chat.updatedAt).toLocaleString()}
      </span>
    </div>
  );
};