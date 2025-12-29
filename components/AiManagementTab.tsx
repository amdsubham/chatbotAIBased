import React, { useState, useCallback } from 'react';
import { useChatsQuery } from '../helpers/useChatsQuery';
import { useDebounce } from '../helpers/useDebounce';
import { useUpdateChatAiSettingMutation } from '../helpers/useUpdateChatAiSettingMutation';
import { ChatDetail } from './ChatDetail';
import { Input } from './Input';
import { Switch } from './Switch';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { BotOff, Search, Inbox, RefreshCw, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
import { Button } from './Button';
import { ChatStatus } from '../helpers/schema';
import { toast } from 'sonner';
import { useQueryClient } from "@tanstack/react-query";
import styles from './AiManagementTab.module.css';

type Chat = NonNullable<ReturnType<typeof useChatsQuery>['data']>[0];

export const AiManagementTab = () => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEnablingAll, setIsEnablingAll] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: chats, isLoading, error, isFetching, refetch } = useChatsQuery({
    aiAutoResponseOff: true,
    searchQuery: debouncedSearchQuery || undefined,
  });

  const queryClient = useQueryClient();
  const updateAiSettingMutation = useUpdateChatAiSettingMutation({ 
    invalidateChatLists: false 
  });

  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
  };

  const handleCloseDetail = () => {
    setSelectedChatId(null);
  };

  const handleEnableAll = useCallback(async () => {
    if (!chats || chats.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to enable AI auto-response for all ${chats.length} chat${chats.length > 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    setIsEnablingAll(true);
    console.log(`Starting bulk AI enable for ${chats.length} chats`);

    try {
      // Process all chats in parallel
      const promises = chats.map((chat) =>
        updateAiSettingMutation.mutateAsync({
          chatId: chat.id,
          aiAutoResponseEnabled: true,
        })
      );

      await Promise.all(promises);
      
      // Manually invalidate the chats list once after all mutations complete
      await queryClient.invalidateQueries({ 
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === "chats" 
      });
      
      console.log(`Successfully enabled AI for all ${chats.length} chats`);
      toast.success(`AI auto-response enabled for all ${chats.length} chat${chats.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error enabling AI for all chats:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to enable AI for some chats: ${errorMessage}`);
    } finally {
      setIsEnablingAll(false);
    }
  }, [chats, updateAiSettingMutation, queryClient]);

  return (
    <div className={styles.container}>
      <div className={`${styles.listPanel} ${selectedChatId ? styles.listPanelHidden : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h2 className={styles.title}>AI Disabled Chats</h2>
            <div className={styles.headerActions}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnableAll}
                    disabled={!chats || chats.length === 0 || isEnablingAll || isFetching}
                  >
                    <Zap size={16} />
                    Enable All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enable AI for all chats in this list</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => refetch()}
                    disabled={isFetching || isEnablingAll}
                    className={isFetching ? styles.spinning : ''}
                  >
                    <RefreshCw size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh list</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <Input
              type="search"
              placeholder="Search by email, shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        <div className={styles.list}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <ChatItemSkeleton key={i} />)
          ) : error ? (
            <div className={styles.emptyState}>
              <p>Error loading chats: {error.message}</p>
            </div>
          ) : !chats || chats.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox size={48} />
              <h3>No Chats Found</h3>
              <p>There are no chats with AI auto-response manually disabled.</p>
            </div>
          ) : (
            chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChatId === chat.id}
                onSelect={() => handleSelectChat(chat.id)}
              />
            ))
          )}
        </div>
      </div>
      <div className={`${styles.detailPanel} ${selectedChatId ? styles.detailPanelVisible : ''}`}>
        {selectedChatId ? (
          <ChatDetail chatId={selectedChatId} onClose={handleCloseDetail} />
        ) : (
          <div className={styles.detailPlaceholder}>
            <BotOff size={64} />
            <h3>Select a Chat</h3>
            <p>Choose a chat from the list to view the full conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: () => void;
}

const ChatItem = ({ chat, isSelected, onSelect }: ChatItemProps) => {
  const updateAiSettingMutation = useUpdateChatAiSettingMutation({ 
    invalidateChatLists: false 
  });

  const handleToggleAi = (enabled: boolean) => {
    updateAiSettingMutation.mutate({
      chatId: chat.id,
      aiAutoResponseEnabled: enabled,
    });
  };

  const getStatusVariant = (status: ChatStatus) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'unresolved':
        return 'destructive';
      case 'active':
      default:
        return 'default';
    }
  };

  return (
    <div
      className={`${styles.chatItem} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      role="button"
      tabIndex={0}
    >
      <div className={styles.chatItemHeader}>
        <div className={styles.merchantInfo}>
          <span className={styles.merchantEmail}>{chat.merchantEmail}</span>
          {chat.shopName && <span className={styles.shopName}>({chat.shopName})</span>}
        </div>
        <Badge variant={getStatusVariant(chat.status)}>{chat.status}</Badge>
      </div>
      <div className={styles.chatItemFooter}>
        <span className={styles.timestamp}>
          AI disabled on {new Date(chat.updatedAt).toLocaleDateString()}
        </span>
        <div
          className={styles.toggleWrapper}
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <label htmlFor={`ai-toggle-${chat.id}`} className={styles.toggleLabel}>
            Enable AI
          </label>
          <Switch
            id={`ai-toggle-${chat.id}`}
            checked={false}
            onCheckedChange={handleToggleAi}
            disabled={updateAiSettingMutation.isPending}
            aria-label="Enable AI auto-response"
          />
        </div>
      </div>
    </div>
  );
};

const ChatItemSkeleton = () => (
  <div className={styles.chatItemSkeleton}>
    <div className={styles.skeletonHeader}>
      <Skeleton style={{ height: '1.25rem', width: '60%' }} />
      <Skeleton style={{ height: '1.5rem', width: '80px', borderRadius: 'var(--radius-full)' }} />
    </div>
    <div className={styles.skeletonFooter}>
      <Skeleton style={{ height: '1rem', width: '40%' }} />
      <Skeleton style={{ height: '1.5rem', width: '100px' }} />
    </div>
  </div>
);