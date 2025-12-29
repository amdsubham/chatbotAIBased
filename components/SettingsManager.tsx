import React from "react";
import { useSettingsQuery } from "../helpers/useSettingsQuery";
import { useUpdateSettingsMutation } from "../helpers/useUpdateSettingsMutation";
import { Switch } from "./Switch";
import { Skeleton } from "./Skeleton";
import { Input } from "./Input";
import { Button } from "./Button";
import { AlertCircle, Bot, User } from "lucide-react";
import { toast } from "sonner";
import styles from "./SettingsManager.module.css";
import { useState, useEffect } from "react";

export const SettingsManager = () => {
  const { data: settings, isLoading, error } = useSettingsQuery();
  const updateMutation = useUpdateSettingsMutation();
  
  const [aiAgentName, setAiAgentName] = useState("");
  const [adminAgentName, setAdminAgentName] = useState("");
  const [nameErrors, setNameErrors] = useState<{ ai?: string; admin?: string }>({});
  
  useEffect(() => {
    if (settings) {
      setAiAgentName(settings.aiAgentName || "");
      setAdminAgentName(settings.adminAgentName || "");
    }
  }, [settings]);

  const handleAutoResponseToggle = (enabled: boolean) => {
    updateMutation.mutate(
      { autoAiResponseEnabled: enabled },
      {
        onSuccess: () => {
          toast.success("Settings updated successfully.");
        },
        onError: (e) => {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          toast.error(`Failed to update settings: ${errorMessage}`);
          // Note: The optimistic update will be reverted automatically by React Query on error.
        },
      }
    );
  };
  
  const validateNames = () => {
    const errors: { ai?: string; admin?: string } = {};
    
    if (aiAgentName.trim().length === 0) {
      errors.ai = "AI agent name cannot be empty";
    } else if (aiAgentName.length > 100) {
      errors.ai = "AI agent name too long (max 100 characters)";
    }
    
    if (adminAgentName.trim().length === 0) {
      errors.admin = "Admin agent name cannot be empty";
    } else if (adminAgentName.length > 100) {
      errors.admin = "Admin agent name too long (max 100 characters)";
    }
    
    setNameErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSaveNames = () => {
    if (!validateNames()) {
      return;
    }
    
    updateMutation.mutate(
      {
        aiAgentName: aiAgentName.trim(),
        adminAgentName: adminAgentName.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Agent names updated successfully.");
          setNameErrors({});
        },
        onError: (e) => {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          toast.error(`Failed to update agent names: ${errorMessage}`);
        },
      }
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <SettingsSkeleton />;
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <AlertCircle size={48} />
          <p>Error loading settings.</p>
          <p className={styles.errorMessage}>
            {error instanceof Error ? error.message : "An unknown error occurred."}
          </p>
        </div>
      );
    }

    if (!settings) {
      return (
        <div className={styles.errorState}>
          <AlertCircle size={48} />
          <p>Could not find any settings.</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.settingSection}>
          <div className={styles.settingHeader}>
            <Bot size={20} />
            <h3 className={styles.settingTitle}>AI Auto-Response</h3>
          </div>
          <p className={styles.settingDescription}>
            Configure how the AI assistant behaves when an administrator is available for live chat.
          </p>
          <div className={styles.settingControl}>
            <div className={styles.settingLabels}>
              <label htmlFor="auto-response-switch" className={styles.settingLabel}>
                Enable AI auto-response
              </label>
              <p className={styles.settingHelperText}>
                When enabled, the AI will automatically respond to all user messages. When disabled, the AI will not respond automatically. You can override this setting for individual chats in the chat view.
              </p>
            </div>
            <Switch
              id="auto-response-switch"
              checked={settings.autoAiResponseEnabled}
              onCheckedChange={handleAutoResponseToggle}
              disabled={updateMutation.isPending}
              aria-label="Toggle AI auto-response"
            />
          </div>
        </div>

        <div className={styles.settingSection}>
          <div className={styles.settingHeader}>
            <User size={20} />
            <h3 className={styles.settingTitle}>Agent Display Names</h3>
          </div>
          <p className={styles.settingDescription}>
            Customize the names shown to users in the chat interface for AI and admin messages.
          </p>
          <div className={styles.settingControl}>
            <div className={styles.nameInputsContainer}>
              <div className={styles.inputGroup}>
                <label htmlFor="ai-agent-name" className={styles.settingLabel}>
                  AI Agent Name
                </label>
                <Input
                  id="ai-agent-name"
                  type="text"
                  value={aiAgentName}
                  onChange={(e) => {
                    setAiAgentName(e.target.value);
                    if (nameErrors.ai) {
                      setNameErrors({ ...nameErrors, ai: undefined });
                    }
                  }}
                  placeholder="e.g., Support Agent"
                  disabled={updateMutation.isPending}
                  className={nameErrors.ai ? styles.inputError : ""}
                />
                {nameErrors.ai && (
                  <p className={styles.errorText}>{nameErrors.ai}</p>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="admin-agent-name" className={styles.settingLabel}>
                  Admin Agent Name
                </label>
                <Input
                  id="admin-agent-name"
                  type="text"
                  value={adminAgentName}
                  onChange={(e) => {
                    setAdminAgentName(e.target.value);
                    if (nameErrors.admin) {
                      setNameErrors({ ...nameErrors, admin: undefined });
                    }
                  }}
                  placeholder="e.g., Support Team"
                  disabled={updateMutation.isPending}
                  className={nameErrors.admin ? styles.inputError : ""}
                />
                {nameErrors.admin && (
                  <p className={styles.errorText}>{nameErrors.admin}</p>
                )}
              </div>

              <p className={styles.settingHelperText}>
                These names will appear next to AI-generated and admin messages in the chat widget. Choose names that clearly identify the message source to your users.
              </p>

              <Button
                onClick={handleSaveNames}
                disabled={updateMutation.isPending}
                className={styles.saveButton}
              >
                {updateMutation.isPending ? "Saving..." : "Save Names"}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
        <p className={styles.description}>
          Manage global settings for the chat system.
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

const SettingsSkeleton = () => (
  <>
    <div className={styles.settingSection}>
      <div className={styles.settingHeader}>
        <Skeleton style={{ height: '20px', width: '20px', borderRadius: 'var(--radius-sm)' }} />
        <Skeleton style={{ height: '1.25rem', width: '200px' }} />
      </div>
      <Skeleton style={{ height: '1rem', width: '80%', marginTop: 'var(--spacing-2)' }} />
      <div className={styles.settingControl} style={{ marginTop: 'var(--spacing-4)' }}>
        <div className={styles.settingLabels}>
          <Skeleton style={{ height: '1.125rem', width: '300px' }} />
          <Skeleton style={{ height: '0.875rem', width: '90%', marginTop: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '0.875rem', width: '85%', marginTop: 'var(--spacing-1)' }} />
        </div>
        <Skeleton style={{ height: '24px', width: '42px' }} />
      </div>
    </div>
    <div className={styles.settingSection}>
      <div className={styles.settingHeader}>
        <Skeleton style={{ height: '20px', width: '20px', borderRadius: 'var(--radius-sm)' }} />
        <Skeleton style={{ height: '1.25rem', width: '200px' }} />
      </div>
      <Skeleton style={{ height: '1rem', width: '80%', marginTop: 'var(--spacing-2)' }} />
      <div className={styles.settingControl} style={{ marginTop: 'var(--spacing-4)' }}>
        <Skeleton style={{ height: '2.5rem', width: '100%' }} />
        <Skeleton style={{ height: '2.5rem', width: '100%', marginTop: 'var(--spacing-3)' }} />
        <Skeleton style={{ height: '2.5rem', width: '120px', marginTop: 'var(--spacing-4)' }} />
      </div>
    </div>
  </>
);