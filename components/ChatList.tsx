import React, { useState, useMemo } from "react";
import { useChatsQuery } from "../helpers/useChatsQuery";
import { useDebounce } from "../helpers/useDebounce";
import { useDeleteChatMutation } from "../helpers/useDeleteChatMutation";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import { Skeleton } from "./Skeleton";
import { ChatListFilters } from "./ChatListFilters";
import { ChatListItem } from "./ChatListItem";
import { Inbox, Trash2 } from "lucide-react";
import { ChatStatus } from "../helpers/schema";
import styles from "./ChatList.module.css";

interface ChatListProps {
  selectedChatId: number | null;
  onSelectChat: (chatId: number) => void;
}

export const ChatList = ({ selectedChatId, onSelectChat }: ChatListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChatStatus | "all" | "online">("all");
  const [hasAdminResponse, setHasAdminResponse] = useState<boolean | undefined>(undefined);
  const [needsAttention, setNeedsAttention] = useState<boolean | undefined>(undefined);
  // Initialize with today's date range for default "Today" filter
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const [aiAutoResponseOff, setAiAutoResponseOff] = useState<boolean | undefined>(undefined);
  const [todayFilter, setTodayFilter] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const deleteChatMutation = useDeleteChatMutation({
    onSuccess: (deletedChatIds) => {
      setSelectedChatIds(prev => {
        const newSet = new Set(prev);
        deletedChatIds.forEach(id => newSet.delete(id));
        return newSet;
      });
      if (Array.isArray(deletedChatIds) && deletedChatIds.includes(selectedChatId!)) {
        onSelectChat(0);
      } else if (typeof deletedChatIds === 'number' && deletedChatIds === selectedChatId) {
        onSelectChat(0);
      }
    }
  });

  const { data: rawChats, isLoading, isFetching, error, refetch } = useChatsQuery({
    searchQuery: debouncedSearchQuery || undefined,
    status: statusFilter === "all" || statusFilter === "online" ? undefined : statusFilter,
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
    hasAdminResponse: hasAdminResponse,
    needsAttention: needsAttention,
    aiAutoResponseOff: aiAutoResponseOff,
  });

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

  const chats = useMemo(() => {
    if (!rawChats) return rawChats;
    
    let filteredChats = rawChats;
    
    if (statusFilter === "online") {
      filteredChats = rawChats.filter(chat => isWidgetOnline(chat));
    }
    
    if (statusFilter === "active") {
      filteredChats = [...filteredChats].sort((a, b) => {
        const aOnline = isWidgetOnline(a);
        const bOnline = isWidgetOnline(b);
        
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return 0;
      });
    }
    
    return filteredChats;
  }, [rawChats, statusFilter]);

  const activeFiltersCount = [
    statusFilter !== "all",
    todayFilter,
    dateFrom !== undefined && !todayFilter,
    dateTo !== undefined && !todayFilter,
    hasAdminResponse !== undefined,
    needsAttention !== undefined,
    aiAutoResponseOff !== undefined,
    debouncedSearchQuery !== "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setHasAdminResponse(undefined);
    setNeedsAttention(undefined);
    setAiAutoResponseOff(undefined);
    setTodayFilter(false);
  };

  const handleSelectChat = (chatId: number) => {
    setSelectedChatIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!chats) return;
    
    if (selectedChatIds.size === chats.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(chats.map(chat => chat.id)));
    }
  };

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    const idsArray = Array.from(selectedChatIds);
    if (idsArray.length === 1) {
      deleteChatMutation.mutate({ chatId: idsArray[0] });
    } else {
      deleteChatMutation.mutate({ chatIds: idsArray });
    }
    setShowDeleteDialog(false);
  };

  const isAllSelected = chats && chats.length > 0 && selectedChatIds.size === chats.length;

  return (
    <div className={styles.container}>
      {selectedChatIds.size > 0 && (
        <div className={styles.bulkActionsBar}>
          <div className={styles.bulkActionsLeft}>
            <Checkbox
              checked={isAllSelected}
              onChange={handleSelectAll}
              className={styles.selectAllCheckbox}
              aria-label="Select all chats"
            />
            <span className={styles.selectedCount}>
              {selectedChatIds.size} selected
            </span>
          </div>
          <Button
            variant="destructive"
            size="md"
            onClick={handleBulkDelete}
            disabled={deleteChatMutation.isPending}
          >
            <Trash2 size={16} />
            Delete ({selectedChatIds.size})
          </Button>
        </div>
      )}

      <ChatListFilters
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        hasAdminResponse={hasAdminResponse}
        onHasAdminResponseChange={setHasAdminResponse}
        needsAttention={needsAttention}
        onNeedsAttentionChange={setNeedsAttention}
        aiAutoResponseOff={aiAutoResponseOff}
        onAiAutoResponseOffChange={setAiAutoResponseOff}
        todayFilter={todayFilter}
        onTodayFilterChange={setTodayFilter}
        showAdvancedFilters={showAdvancedFilters}
        onShowAdvancedFiltersChange={setShowAdvancedFilters}
        activeFiltersCount={activeFiltersCount}
        debouncedSearchQuery={debouncedSearchQuery}
        onClearAllFilters={clearAllFilters}
        onRefetch={refetch}
        isFetching={isFetching}
      />

      <div className={styles.list}>
        {isLoading && !rawChats ? (
          Array.from({ length: 5 }).map((_, i) => <ChatListItemSkeleton key={i} />)
        ) : error ? (
          <div className={styles.emptyState}>Error loading chats.</div>
        ) : !chats || chats.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox size={48} />
            <p>No chats found.</p>
          </div>
        ) : (
          chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              isBulkSelected={selectedChatIds.has(chat.id)}
              onSelect={() => onSelectChat(chat.id)}
              onBulkSelect={() => handleSelectChat(chat.id)}
            />
          ))
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedChatIds.size === 1 ? 'Chat' : 'Chats'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedChatIds.size === 1 ? 'this chat' : `these ${selectedChatIds.size} chats`}? 
              This action cannot be undone. All messages in {selectedChatIds.size === 1 ? 'the chat' : 'these chats'} will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteChatMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete}
              disabled={deleteChatMutation.isPending}
            >
              {deleteChatMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ChatListItemSkeleton = () => (
  <div className={styles.skeletonItem}>
    <div className={styles.skeletonHeader}>
      <Skeleton style={{ height: '1rem', width: '60%' }} />
      <Skeleton style={{ height: '1.25rem', width: '80px' }} />
    </div>
    <Skeleton style={{ height: '0.875rem', width: '40%', marginTop: 'var(--spacing-1)' }} />
    <Skeleton style={{ height: '0.875rem', width: '90%', marginTop: 'var(--spacing-2)' }} />
    <Skeleton style={{ height: '0.75rem', width: '50%', marginTop: 'var(--spacing-2)' }} />
  </div>
);