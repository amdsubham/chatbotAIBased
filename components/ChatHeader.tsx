import React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { Switch } from "./Switch";
import { useUpdateChatAiSettingMutation } from "../helpers/useUpdateChatAiSettingMutation";
import styles from "./ChatHeader.module.css";

export interface ChatHeaderProps {
  chatId: number;
  onClose?: () => void;
  isAdmin?: boolean;
  aiAutoResponseEnabled: boolean | null;
  globalAiAutoResponseEnabled?: boolean;
}

export const ChatHeader = ({
  chatId,
  onClose,
  isAdmin,
  aiAutoResponseEnabled,
  globalAiAutoResponseEnabled,
}: ChatHeaderProps) => {
  const updateAiSettingMutation = useUpdateChatAiSettingMutation();

  const effectiveAiEnabled = aiAutoResponseEnabled ?? globalAiAutoResponseEnabled ?? false;

  const handleAiToggle = (checked: boolean) => {
    updateAiSettingMutation.mutate({
      chatId,
      aiAutoResponseEnabled: checked,
    });
  };

  const handleResetToDefault = () => {
    updateAiSettingMutation.mutate({
      chatId,
      aiAutoResponseEnabled: null,
    });
  };

  const getStatusLabel = () => {
    if (aiAutoResponseEnabled === null) {
      return "Default";
    }
    return aiAutoResponseEnabled ? "On" : "Off";
  };

  const getStatusClass = () => {
    if (aiAutoResponseEnabled === null) {
      return styles.statusDefault;
    }
    return aiAutoResponseEnabled ? styles.statusOn : styles.statusOff;
  };

  return (
    <div className={styles.chatHeader}>
      {onClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          title="Close chat"
        >
          <X size={16} />
        </Button>
      )}
      {isAdmin && (
        <div className={styles.aiToggleContainer}>
          <div className={styles.aiToggleContent}>
            <label htmlFor={`ai-toggle-${chatId}`} className={styles.aiToggleLabel}>
              AI Auto-Response
              <span className={`${styles.statusBadge} ${getStatusClass()}`}>
                {getStatusLabel()}
              </span>
            </label>
            <Switch
              id={`ai-toggle-${chatId}`}
              checked={effectiveAiEnabled}
              onCheckedChange={handleAiToggle}
              disabled={updateAiSettingMutation.isPending}
            />
          </div>
          {aiAutoResponseEnabled !== null && (
            <button
              onClick={handleResetToDefault}
              className={styles.resetButton}
              disabled={updateAiSettingMutation.isPending}
              type="button"
            >
              Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  );
};