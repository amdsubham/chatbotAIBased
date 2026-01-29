# Online/Offline Status Tracking - Debug & Testing Guide

## What Was Fixed

### Issue #1: Wrong Logic - Tracking Widget State Instead of Page Presence ✅
**Problem**: The system was tracking whether the widget was open/minimized instead of whether the merchant was on the page.

**Fix**: Changed to always send `isOpen: true` while the page is loaded, regardless of widget open/minimized state. Removed `widgetOpen` check from `isWidgetOnline` function.

**Files Changed**:
- `components/ChatWidget.tsx` (lines 259-267, 269-293)
- `components/ChatList.tsx` (lines 65-72)
- `components/ChatListItem.tsx` (lines 32-39)

### Issue #2: No Cleanup on Page Exit ✅
**Problem**: When merchants closed the page, their status remained "online" until the 2-minute timeout expired.

**Fix**: Added `beforeunload` event handler that uses `navigator.sendBeacon` for reliable offline tracking during page unload.

**Files Changed**:
- `components/ChatWidget.tsx` (lines 295-330)

### Issue #3: Delayed Admin Dashboard Updates ✅
**Problem**: The mutation only invalidated individual chat queries, not the chats list, causing delays in admin dashboard updates.

**Fix**: Added `queryClient.invalidateQueries({ queryKey: ['chats'] })` to immediately refresh the admin dashboard.

**Files Changed**:
- `helpers/useUpdateWidgetPresenceMutation.tsx` (line 14)

## How To Test

### Test 1: Merchant Goes Online (Page Loads)
1. Open the admin dashboard in one browser window
2. Click "Filters" and select "Online" status filter
3. In another browser window, load the page with the chatbot widget (merchant page)
4. **Expected**: Within 5-10 seconds, the merchant should appear in the admin dashboard's online list
5. **Check browser console** for logs like:
   ```
   [ChatWidget] Chat created, marking merchant as online (page loaded)
   [ChatWidget] Starting periodic page presence updates for chat X
   [ChatWidget] Periodic page presence update - merchant is still on page
   ```

### Test 2: Merchant Minimizes Widget (But Stays on Page)
1. With a merchant session active, minimize/close the chat widget (don't close the page)
2. **Expected**: Merchant should **remain "online"** (because they're still on the page)
3. Open the widget again
4. **Expected**: Merchant still shows as "online" (no interruption)

### Test 3: Merchant Goes Offline (Page Close)
1. Have a merchant showing as "online" in the admin dashboard
2. Close the entire merchant browser window/tab
3. **Expected**: Within 5-10 seconds, the merchant should disappear from the "online" filter
4. **Check browser console before closing** for logs like:
   ```
   [ChatWidget] Page unloading, marking widget as offline
   ```

### Test 4: Idle Timeout (2 Minutes)
1. Have a merchant showing as "online"
2. Keep the page open but don't interact for 2+ minutes
3. **Expected**: After 2 minutes of no activity, the merchant should disappear from the "online" filter
4. This works because `isWidgetOnline()` checks if `widgetLastSeenAt` is within the last 2 minutes

## Debugging Checklist

If online status is still not working, check these:

### Merchant Widget Side:
1. **Open Browser DevTools Console** on the merchant page
2. Look for these logs:
   - `[ChatWidget] Chat created, marking merchant as online (page loaded)`
   - `[ChatWidget] Starting periodic page presence updates for chat X`
   - `[ChatWidget] Periodic page presence update - merchant is still on page`
3. **Check Network Tab** for requests to `/_api/chat/widget-presence`
   - Should see POST requests every 60 seconds
   - Check if they're returning 200 OK
4. **Check for errors**:
   - Any CORS errors?
   - Any 404/500 errors?
   - Any authentication issues?

### Admin Dashboard Side:
1. **Open Browser DevTools Console** on the admin page
2. Look for these logs:
   - `Notification sound initialized for polling`
   - The chats query should refetch every 10 seconds (check Network tab)
3. **Check Network Tab** for requests to `/_api/chats`
   - Should see GET requests every 10 seconds when on the "Chats" tab
   - Response should include `widgetLastSeenAt` field
4. **Verify the online filter logic**:
   - Open React DevTools
   - Select the ChatList component
   - Check if `isWidgetOnline()` function is correctly calculating online status

### Database Side:
If the widget presence requests are successful but status isn't updating:

1. **Check database connection**:
   - Are the updates being written to the `chats` table?
   - Query: `SELECT id, merchant_email, widget_last_seen_at FROM chats WHERE widget_last_seen_at > NOW() - INTERVAL '2 minutes';`

2. **Check field names** (Kysely maps snake_case to camelCase):
   - Database column: `widget_last_seen_at`
   - TypeScript property: `widgetLastSeenAt`

## How Online Status Detection Works

A merchant is considered **online** when:
- `widgetLastSeenAt` is within the last 2 minutes (page is loaded and active)

**Note**: We track **page presence**, not widget open/close state. If the merchant has the page loaded (even with widget minimized), they show as online.

```typescript
// From ChatList.tsx and ChatListItem.tsx
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
```

## Technical Details

### Update Frequency:
- **Immediate**: When chat is created (page loads)
- **Periodic**: Every 60 seconds (via setInterval) to keep `widgetLastSeenAt` fresh
- **On Unload**: When page closes (via beforeunload event)

**Note**: We always send `isOpen: true` while the page is loaded, regardless of widget minimized/maximized state.

### Admin Dashboard Polling:
- **Interval**: Every 10 seconds
- **Endpoint**: `GET /_api/chats`
- **Enabled**: Only when on the "Chats" tab

### API Call Frequency (Per Merchant):
- **1 call** when page loads (chat created)
- **1 call every 60 seconds** while page is open
- **1 call** when page closes

This is very efficient - only ~60 calls per hour per merchant.

### Data Flow:
```
Merchant Page Loads (Chat Created)
        ↓
POST /_api/chat/widget-presence
{ chatId: X, isOpen: true }
        ↓
Database: UPDATE chats SET widget_open = true, widget_last_seen_at = NOW() WHERE id = X
        ↓
React Query: Invalidate ['chats'] and ['chat', X]
        ↓
Admin Dashboard: Re-fetch chats list (within 10 seconds or immediately)
        ↓
Online filter: Apply isWidgetOnline() logic (check widgetLastSeenAt < 2 min ago)
        ↓
Display: Merchant appears in online list

Every 60 seconds while page is open:
        ↓
POST /_api/chat/widget-presence { chatId: X, isOpen: true }
        ↓
Updates widgetLastSeenAt → Keeps merchant showing as online

When merchant closes tab:
        ↓
beforeunload event → navigator.sendBeacon
POST /_api/chat/widget-presence { chatId: X, isOpen: false }
        ↓
Merchant immediately removed from online list
```

## Still Having Issues?

If after all these checks the online status is still not working:

1. **Verify the chatbot is deployed** and the DATABASE_URL is correct
2. **Check if there are any middleware/proxy** issues blocking the API requests
3. **Verify CORS settings** - the widget-presence endpoint has CORS enabled
4. **Check Railway/hosting logs** for any server-side errors
5. **Verify database schema** - ensure `widget_last_seen_at` column exists in the `chats` table

## Quick SQL Debugging Queries

```sql
-- Check all online merchants (last seen within 2 minutes)
SELECT id, merchant_email, widget_last_seen_at,
       NOW() - widget_last_seen_at AS last_seen_ago
FROM chats
WHERE widget_last_seen_at > NOW() - INTERVAL '2 minutes'
ORDER BY widget_last_seen_at DESC;

-- Check recent widget activity (last 5 minutes)
SELECT id, merchant_email, widget_last_seen_at
FROM chats
WHERE widget_last_seen_at > NOW() - INTERVAL '5 minutes'
ORDER BY widget_last_seen_at DESC;

-- Manually mark a chat as online (for testing)
UPDATE chats
SET widget_open = true, widget_last_seen_at = NOW()
WHERE id = 1;  -- Replace with your test chat ID
```
