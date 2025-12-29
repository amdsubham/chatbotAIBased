import { Button } from "./Button";
import { Badge } from "./Badge";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { Search, SlidersHorizontal, X, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { ChatStatus } from "../helpers/schema";
import styles from "./ChatListFilters.module.css";

interface ChatListFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: ChatStatus | "all" | "online";
  onStatusFilterChange: (value: ChatStatus | "all" | "online") => void;
  dateFrom: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (date: Date | undefined) => void;
  hasAdminResponse: boolean | undefined;
  onHasAdminResponseChange: (value: boolean | undefined) => void;
  needsAttention: boolean | undefined;
  onNeedsAttentionChange: (value: boolean | undefined) => void;
  aiAutoResponseOff: boolean | undefined;
  onAiAutoResponseOffChange: (value: boolean | undefined) => void;
  todayFilter: boolean;
  onTodayFilterChange: (value: boolean) => void;
  showAdvancedFilters: boolean;
  onShowAdvancedFiltersChange: (value: boolean) => void;
  activeFiltersCount: number;
  debouncedSearchQuery: string;
  onClearAllFilters: () => void;
  onRefetch: () => void;
  isFetching: boolean;
}

const statusFilters: { label: string; value: ChatStatus | "all" | "online" }[] = [
  { label: "All", value: "all" },
  { label: "Online", value: "online" },
  { label: "Open", value: "active" },
  { label: "Resolved", value: "resolved" },
  { label: "Unresolved", value: "unresolved" },
];

export const ChatListFilters = ({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  hasAdminResponse,
  onHasAdminResponseChange,
  needsAttention,
  onNeedsAttentionChange,
  aiAutoResponseOff,
  onAiAutoResponseOffChange,
  todayFilter,
  onTodayFilterChange,
  showAdvancedFilters,
  onShowAdvancedFiltersChange,
  activeFiltersCount,
  debouncedSearchQuery,
  onClearAllFilters,
  onRefetch,
  isFetching,
}: ChatListFiltersProps) => {
  const clearFilter = (filterName: string) => {
    switch (filterName) {
      case "search":
        onSearchQueryChange("");
        break;
      case "status":
        onStatusFilterChange("all");
        break;
      case "today":
        onTodayFilterChange(false);
        onDateFromChange(undefined);
        onDateToChange(undefined);
        break;
      case "dateFrom":
        onDateFromChange(undefined);
        if (todayFilter) onTodayFilterChange(false);
        break;
      case "dateTo":
        onDateToChange(undefined);
        if (todayFilter) onTodayFilterChange(false);
        break;
      case "hasAdminResponse":
        onHasAdminResponseChange(undefined);
        break;
      case "needsAttention":
        onNeedsAttentionChange(undefined);
        break;
      case "aiAutoResponseOff":
        onAiAutoResponseOffChange(undefined);
        break;
    }
  };

  const handleTodayClick = () => {
    const newTodayValue = !todayFilter;
    onTodayFilterChange(newTodayValue);
    
    if (newTodayValue) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      onDateFromChange(startOfDay);
      onDateToChange(endOfDay);
    } else {
      onDateFromChange(undefined);
      onDateToChange(undefined);
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onDateFromChange(date);
    if (todayFilter) onTodayFilterChange(false);
  };

  const handleDateToChange = (date: Date | undefined) => {
    onDateToChange(date);
    if (todayFilter) onTodayFilterChange(false);
  };

  const handleStatusFilterChange = (value: ChatStatus | "all" | "online") => {
    onStatusFilterChange(value);
    if (value === "all" && todayFilter) {
      onTodayFilterChange(false);
      onDateFromChange(undefined);
      onDateToChange(undefined);
    }
  };

  return (
    <div className={styles.controls}>
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className={styles.searchInput}
          />
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
          <TooltipContent>Refresh chats</TooltipContent>
        </Tooltip>
        <Button
          variant={showAdvancedFilters ? "primary" : "outline"}
          size="md"
          onClick={() => onShowAdvancedFiltersChange(!showAdvancedFilters)}
          className={styles.advancedFiltersButton}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className={styles.filterCountBadge}>
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {showAdvancedFilters && (
        <div className={styles.advancedFiltersPanel}>
          <div className={styles.filterRow}>
            <div className={styles.datePickerGroup}>
              <label className={styles.filterLabel}>Date Range</label>
              <div className={styles.datePickerRow}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="md" className={styles.datePicker}>
                      <CalendarIcon size={16} />
                      {dateFrom ? dateFrom.toLocaleDateString() : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding>
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => handleDateFromChange(date as Date | undefined)}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="md" className={styles.datePicker}>
                      <CalendarIcon size={16} />
                      {dateTo ? dateTo.toLocaleDateString() : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding>
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => handleDateToChange(date as Date | undefined)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className={styles.filterRow}>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <Checkbox
                  checked={needsAttention === true}
                  onChange={(e) => onNeedsAttentionChange(e.target.checked ? true : undefined)}
                />
                <span>Needs Response</span>
              </label>
              <label className={styles.checkboxLabel}>
                <Checkbox
                  checked={hasAdminResponse === true}
                  onChange={(e) => onHasAdminResponseChange(e.target.checked ? true : undefined)}
                />
                <span>Has Admin Response</span>
              </label>
              <label className={styles.checkboxLabel}>
                <Checkbox
                  checked={aiAutoResponseOff === true}
                  onChange={(e) => onAiAutoResponseOffChange(e.target.checked ? true : undefined)}
                />
                <span>AI Auto-Response Off</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeFiltersCount > 0 && (
        <div className={styles.activeFilters}>
          {debouncedSearchQuery && (
            <Badge variant="outline" className={styles.filterBadge}>
              Search: "{debouncedSearchQuery}"
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("search")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="outline" className={styles.filterBadge}>
              Status: {statusFilter === "active" ? "Open" : statusFilter === "online" ? "Online" : statusFilter}
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("status")}
                aria-label="Clear status filter"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {todayFilter && (
            <Badge variant="outline" className={styles.filterBadge}>
              Today
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("today")}
                aria-label="Clear today filter"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {dateFrom && !todayFilter && (
            <Badge variant="outline" className={styles.filterBadge}>
              From: {dateFrom.toLocaleDateString()}
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("dateFrom")}
                aria-label="Clear from date"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {dateTo && !todayFilter && (
            <Badge variant="outline" className={styles.filterBadge}>
              To: {dateTo.toLocaleDateString()}
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("dateTo")}
                aria-label="Clear to date"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {hasAdminResponse !== undefined && (
            <Badge variant="outline" className={styles.filterBadge}>
              Has Admin Response
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("hasAdminResponse")}
                aria-label="Clear admin response filter"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {needsAttention !== undefined && (
            <Badge variant="outline" className={styles.filterBadge}>
              Needs Response
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("needsAttention")}
                aria-label="Clear needs attention filter"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {aiAutoResponseOff !== undefined && (
            <Badge variant="outline" className={styles.filterBadge}>
              AI Auto-Response Off
              <button
                className={styles.clearFilterButton}
                onClick={() => clearFilter("aiAutoResponseOff")}
                aria-label="Clear AI auto-response filter"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {activeFiltersCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className={styles.clearAllButton}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      <div className={styles.filterGroup}>
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? "primary" : "ghost"}
            size="sm"
            onClick={() => handleStatusFilterChange(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
        <Button
          variant={todayFilter ? "primary" : "ghost"}
          size="sm"
          onClick={handleTodayClick}
        >
          Today
        </Button>
      </div>
    </div>
  );
};