import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Switch } from "./Switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./DropdownMenu";
import { ArrowLeft, RefreshCw, Trash2, Download, Mail, BookPlus, ChevronDown, ChevronUp, Maximize2 } from "lucide-react";
import { AddQAFromChatDialog } from "./AddQAFromChatDialog";
import { useUpdateChatAiSettingMutation } from "../helpers/useUpdateChatAiSettingMutation";
import { useSettingsQuery } from "../helpers/useSettingsQuery";
import { useMerchantUserByEmail } from "../helpers/useMerchantUsersQuery";
import styles from "./ChatDetailHeader.module.css";

interface ChatDetailHeaderProps {
  chat: {
    id: number;
    merchantEmail: string;
    shopName: string | null;
    status: "active" | "resolved" | "unresolved";
    emailNotificationSent: boolean;
    aiAutoResponseEnabled: boolean | null;
  };
  isUnanswered: boolean;
  isFetching: boolean;
  exportPending: boolean;
  sendEmailPending: boolean;
  deletePending: boolean;
  updateStatusPending: boolean;
  onClose: () => void;
  onRefetch: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: "active" | "resolved" | "unresolved") => void;
  onExport: (format: "pdf" | "json" | "txt") => void;
  onSendEmailReminder: () => void;
  onExpandDetails: () => void;
}

export const ChatDetailHeader = ({
  chat,
  isUnanswered,
  isFetching,
  exportPending,
  sendEmailPending,
  deletePending,
  updateStatusPending,
  onClose,
  onRefetch,
  onDelete,
  onUpdateStatus,
  onExport,
  onSendEmailReminder,
  onExpandDetails,
}: ChatDetailHeaderProps) => {
  const updateAiSettingMutation = useUpdateChatAiSettingMutation();
  const { data: settings } = useSettingsQuery();
  const { data: merchantUser, isLoading: merchantUserLoading } = useMerchantUserByEmail(chat.merchantEmail);

  // Collapse state for mobile
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize collapsed state based on screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setIsCollapsed(isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const globalAiAutoResponseEnabled = settings?.autoAiResponseEnabled ?? false;
  const effectiveAiEnabled = chat.aiAutoResponseEnabled ?? globalAiAutoResponseEnabled;

  const handleAiToggle = (checked: boolean) => {
    updateAiSettingMutation.mutate({
      chatId: chat.id,
      aiAutoResponseEnabled: checked,
    });
  };

  const handleResetToDefault = () => {
    updateAiSettingMutation.mutate({
      chatId: chat.id,
      aiAutoResponseEnabled: null,
    });
  };

  const getStatusLabel = () => {
    if (chat.aiAutoResponseEnabled === null) {
      return "Default";
    }
    return chat.aiAutoResponseEnabled ? "On" : "Off";
  };

  const getStatusClass = () => {
    if (chat.aiAutoResponseEnabled === null) {
      return styles.statusDefault;
    }
    return chat.aiAutoResponseEnabled ? styles.statusOn : styles.statusOff;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "resolved":
        return "success";
      case "unresolved":
        return "destructive";
      case "active":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <header className={`${styles.header} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Left Section: Back + User Info + Refresh */}
      <div className={styles.leftSection}>
        <Button variant="ghost" size="icon" className={styles.backButton} onClick={onClose}>
          <ArrowLeft size={18} />
        </Button>
        <div className={styles.userInfo}>
          <div className={styles.emailWithBadge}>
            <h3 className={styles.headerTitle}>{chat.merchantEmail}</h3>
            {merchantUser && (
              <Badge
                variant={merchantUser.billingPlan === "Pro" ? "default" : "secondary"}
                className={styles.planBadge}
              >
                {merchantUser.billingPlan || "Free"}
              </Badge>
            )}
          </div>
          <p className={styles.headerSubtitle}>{chat.shopName || "No shop name"}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onRefetch}
              disabled={isFetching}
              className={styles.refreshButton}
            >
              <RefreshCw size={16} className={isFetching ? styles.spinning : ""} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh chat</TooltipContent>
        </Tooltip>
        {/* Mobile collapse/expand toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={styles.collapseToggle}
            >
              {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCollapsed ? 'Expand header' : 'Collapse header'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Center Section: AI Toggle (Inline) */}
      <div className={`${styles.centerSection} ${isCollapsed ? styles.hidden : ''}`}>
        <div className={styles.aiToggleInline}>
          <label htmlFor={`ai-toggle-${chat.id}`} className={styles.aiToggleLabel}>
            AI Auto-Response
          </label>
          <span className={`${styles.statusBadge} ${getStatusClass()}`}>
            {getStatusLabel()}
          </span>
          <Switch
            id={`ai-toggle-${chat.id}`}
            checked={effectiveAiEnabled}
            onCheckedChange={handleAiToggle}
            disabled={updateAiSettingMutation.isPending}
            className={styles.aiSwitch}
          />
          {chat.aiAutoResponseEnabled !== null && (
            <button
              onClick={handleResetToDefault}
              className={styles.resetLink}
              disabled={updateAiSettingMutation.isPending}
              type="button"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Right Section: Status Badge + Actions */}
      <div className={`${styles.rightSection} ${isCollapsed ? styles.hidden : ''}`}>
        <Badge variant={getStatusBadgeVariant(chat.status)} className={styles.chatStatusBadge}>
          {chat.status}
        </Badge>
        <div className={styles.actionButtons}>
          <Button
            variant={chat.status === "resolved" ? "primary" : "outline"}
            size="sm"
            onClick={() => onUpdateStatus("resolved")}
            disabled={updateStatusPending || chat.status === "resolved"}
            className={styles.statusButton}
          >
            Resolved
          </Button>
          <Button
            variant={chat.status === "unresolved" ? "primary" : "outline"}
            size="sm"
            onClick={() => onUpdateStatus("unresolved")}
            disabled={updateStatusPending || chat.status === "unresolved"}
            className={styles.statusButton}
          >
            Unresolved
          </Button>
          {isUnanswered && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={chat.emailNotificationSent ? "secondary" : "outline"}
                  size="sm"
                  onClick={onSendEmailReminder}
                  disabled={chat.emailNotificationSent || sendEmailPending}
                  className={styles.iconButton}
                >
                  <Mail size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {chat.emailNotificationSent 
                  ? "Email reminder sent"
                  : "Send email reminder"}
              </TooltipContent>
            </Tooltip>
          )}
          <AddQAFromChatDialog chatId={chat.id}>
            <Button
              variant="outline"
              size="sm"
              className={styles.iconButton}
              aria-label="Add to knowledge base"
            >
              <BookPlus size={14} />
            </Button>
          </AddQAFromChatDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={exportPending}
                className={styles.iconButton}
              >
                <Download size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("json")}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("txt")}>
                Export as TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onExpandDetails}
                className={styles.expandButton}
              >
                <Maximize2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View merchant details</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={onDelete}
                disabled={deletePending}
                className={styles.deleteButton}
              >
                <Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete chat</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
};