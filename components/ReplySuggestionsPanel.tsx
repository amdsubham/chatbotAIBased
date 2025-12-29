import React, { useEffect } from 'react';
import { Sparkles, Zap, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useAiSuggestRepliesMutation } from '../helpers/useAiSuggestRepliesMutation';
import { useShortcutMessagesQuery } from '../helpers/useShortcutMessagesQuery';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import styles from './ReplySuggestionsPanel.module.css';

interface ReplySuggestionsPanelProps {
  chatId: number;
  currentDraft: string;
  onSelectReply: (reply: string) => void;
  onClose: () => void;
  className?: string;
}

export const ReplySuggestionsPanel = ({
  chatId,
  currentDraft,
  onSelectReply,
  onClose,
  className,
}: ReplySuggestionsPanelProps) => {
  const {
    mutate: suggestReplies,
    data: aiData,
    isPending: isAiPending,
    isError: isAiError,
    error: aiError,
  } = useAiSuggestRepliesMutation();

  const {
    data: shortcutsData,
    isFetching: isShortcutsFetching,
    isError: isShortcutsError,
  } = useShortcutMessagesQuery();

  const isDraftMode = currentDraft.trim().length > 0;

  const handleRefresh = () => {
    if (isDraftMode) {
      suggestReplies({ chatId, draftMessage: currentDraft });
    } else {
      suggestReplies({ chatId });
    }
  };

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const renderAiSuggestions = () => {
    if (isAiPending) {
      return (
        <>
          <Skeleton className={styles.skeleton} />
          <Skeleton className={styles.skeleton} />
          <Skeleton className={styles.skeleton} />
        </>
      );
    }

    if (isAiError) {
      const errorMessage = aiError instanceof Error 
        ? aiError.message 
        : `Failed to load ${isDraftMode ? 'AI improvements' : 'AI suggestions'}.`;
      
      const isRetryableError = errorMessage.toLowerCase().includes('busy') || 
                                errorMessage.toLowerCase().includes('try again');
      
      return (
        <div className={styles.errorState}>
          <AlertCircle size={16} />
          <div className={styles.errorContent}>
            <span>{errorMessage}</span>
            {isRetryableError && (
              <span className={styles.retryHint}>Click refresh to try again.</span>
            )}
          </div>
        </div>
      );
    }

    // Type guard for successful response
    if (!aiData || 'error' in aiData) {
      return (
        <p className={styles.emptyState}>
          {isDraftMode ? 'No improvements available.' : 'No AI suggestions available.'}
        </p>
      );
    }

    if (aiData.suggestions.length === 0) {
      return (
        <p className={styles.emptyState}>
          {isDraftMode ? 'No improvements available.' : 'No AI suggestions available.'}
        </p>
      );
    }

    return aiData.suggestions.map((suggestion: string, index: number) => (
      <button
        key={`ai-${index}`}
        className={styles.suggestionItem}
        onClick={() => onSelectReply(suggestion)}
      >
        {suggestion}
      </button>
    ));
  };

  const renderShortcutMessages = () => {
    if (isShortcutsFetching) {
      return (
        <>
          <Skeleton className={styles.skeleton} />
          <Skeleton className={styles.skeleton} />
        </>
      );
    }

    if (isShortcutsError) {
      return (
        <div className={styles.errorState}>
          <AlertCircle size={16} />
          <span>Failed to load shortcuts.</span>
        </div>
      );
    }

    if (!shortcutsData || shortcutsData.length === 0) {
      return <p className={styles.emptyState}>No shortcut messages found.</p>;
    }

    return shortcutsData.map((shortcut) => (
      <button
        key={`shortcut-${shortcut.id}`}
        className={styles.suggestionItem}
        onClick={() => onSelectReply(shortcut.message)}
      >
        <span className={styles.shortcutName}>{shortcut.name}</span>
        <span className={styles.shortcutMessage}>{shortcut.message}</span>
      </button>
    ));
  };

  return (
    <div className={`${styles.panel} ${className || ''}`}>
      <header className={styles.header}>
        <h3 className={styles.title}>Suggestions</h3>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isAiPending}
            aria-label="Refresh AI suggestions"
          >
            <RefreshCw size={16} className={isAiPending ? styles.spinning : ''} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close suggestions">
            <X size={16} />
          </Button>
        </div>
      </header>
      <div className={styles.content}>
        <section className={styles.section}>
          <h4 className={styles.sectionHeader}>
            <Sparkles size={16} className={styles.icon} />
            {isDraftMode ? 'AI Improvements' : 'AI Suggestions'}
          </h4>
          {isDraftMode && (
            <p className={styles.modeIndicator}>
              Improving your draft message...
            </p>
          )}
          {isDraftMode && currentDraft && (
            <div className={styles.draftPreview}>
              <span className={styles.draftLabel}>Original draft:</span>
              <span className={styles.draftText}>{currentDraft}</span>
            </div>
          )}
          <div className={styles.list}>{renderAiSuggestions()}</div>
        </section>
        <section className={styles.section}>
          <h4 className={styles.sectionHeader}>
            <Zap size={16} className={styles.icon} />
            Shortcut Messages
          </h4>
          <div className={styles.list}>{renderShortcutMessages()}</div>
        </section>
      </div>
    </div>
  );
};