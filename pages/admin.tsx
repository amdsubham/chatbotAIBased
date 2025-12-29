import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { ChatList } from "../components/ChatList";
import { ChatDetail } from "../components/ChatDetail";
import { useChatQuery } from "../helpers/useChatQuery";
import { KnowledgeBaseManager } from "../components/KnowledgeBaseManager";
import { AvailabilityManager } from "../components/AvailabilityManager";
import { EmbedScriptGenerator } from "../components/EmbedScriptGenerator";
import { ShortcutMessagesManager } from "../components/ShortcutMessagesManager";
import { SettingsManager } from "../components/SettingsManager";
import { AiManagementTab } from "../components/AiManagementTab";
import { NotificationBadge } from "../components/NotificationBadge";
import { NotificationSettings } from "../components/NotificationSettings";
import { Popover, PopoverTrigger, PopoverContent } from "../components/Popover";
import { Button } from "../components/Button";
import { useNotificationPermission } from "../helpers/useNotificationPermission";
import { useNotificationPolling } from "../helpers/useNotificationPolling";
import { useNotificationPreferences } from "../helpers/useNotificationPreferences";
import { useAuth } from "../helpers/useAuth";
// import { useUnseenMessageNotificationPolling } from "../helpers/useUnseenMessageNotificationPolling";
import styles from "./admin.module.css";

const AdminPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // TEMPORARILY DISABLED: Unseen message notification polling
  // This feature is disabled due to Brevo IP security issues.
  // Serverless function IP rotation is triggering hundreds of "Verify a new IP" emails.
  // Re-enable once IPs are whitelisted in Brevo or a different email provider is used.
  // useUnseenMessageNotificationPolling();
  console.warn('⚠️ Email notification polling is temporarily disabled due to Brevo IP security alerts');
  
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  
  // Fetch selected chat data for dynamic title
  const { data: selectedChat } = useChatQuery(
    { chatId: selectedChatId! },
    { enabled: !!selectedChatId }
  );
  const [activeTab, setActiveTab] = useState("chats");
  const { pollingInterval, pollingEnabled, setPollingInterval, setEnabled } = useNotificationPreferences();
  const { permission, requestPermission, isSupported } = useNotificationPermission();
  const hasRequestedPermission = useRef(false);

  // Only enable polling when on the chats tab and when enabled by user
  const { newMessages, newMessageCount, reset } = useNotificationPolling({
    interval: pollingInterval,
    enabled: activeTab === "chats" && pollingEnabled,
  });

  // Track which messages have already triggered browser notifications
  const notifiedMessagesRef = useRef<Set<string>>(new Set());

  // Request notification permission on mount (once per session)
  useEffect(() => {
    if (!hasRequestedPermission.current && isSupported && permission === "default") {
      hasRequestedPermission.current = true;
      requestPermission();
    }
  }, [isSupported, permission, requestPermission]);

  // Show browser notifications for new messages
  useEffect(() => {
    if (permission !== "granted" || !isSupported) {
      return;
    }

    newMessages.forEach((message) => {
      const messageKey = `${message.chatId}-${message.content}`;
      
      // Prevent duplicate notifications
      if (notifiedMessagesRef.current.has(messageKey)) {
        return;
      }

      notifiedMessagesRef.current.add(messageKey);

      const notification = new Notification(`New message from ${message.merchantEmail}`, {
        body: message.content.length > 100 
          ? `${message.content.substring(0, 100)}...` 
          : message.content,
        icon: '/favicon.ico',
        tag: `chat-${message.chatId}`, // Prevent duplicate notifications for same chat
      });

      notification.onclick = () => {
        window.focus();
        setSelectedChatId(message.chatId);
        setActiveTab("chats");
        notification.close();
      };

      console.log(`Browser notification shown for chat ${message.chatId}`);
    });
  }, [newMessages, permission, isSupported]);

  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
    // Reset notifications when a chat is selected
    reset();
  };

  const handleCloseChat = () => {
    setSelectedChatId(null);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset notifications when switching tabs
    if (value === "chats") {
      reset();
    }
  };

  const handleBadgeClick = () => {
    reset();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Dynamic page title based on selected chat
  const pageTitle = selectedChat
    ? `${selectedChat.shopName || selectedChat.merchantEmail} - Chat | Admin Dashboard`
    : "Admin Dashboard | Universal AI Support";

  // Emoji-based favicon as a quick solution
  const faviconDataUrl = 
    "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💬</text></svg>";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Manage chats and knowledge base for the AI Support Chatbot." />
        <link rel="icon" type="image/svg+xml" href={faviconDataUrl} />
      </Helmet>
      <div className={styles.adminContainer}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>Admin Dashboard</h1>
              <p className={styles.subtitle}>
                Manage conversations and train your AI assistant.
              </p>
            </div>
            <div className={styles.headerControls}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notification settings">
                    <Settings size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent removeBackgroundAndPadding>
                  <NotificationSettings
                    pollingInterval={pollingInterval}
                    onPollingIntervalChange={setPollingInterval}
                    enabled={pollingEnabled}
                    onEnabledChange={setEnabled}
                  />
                </PopoverContent>
              </Popover>
              <NotificationBadge 
                count={newMessageCount} 
                onReset={handleBadgeClick} 
              />
              <Button 
                variant="outline" 
                size="md" 
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className={styles.mainContent}>
          <Tabs defaultValue="chats" value={activeTab} onValueChange={handleTabChange} className={styles.tabs}>
            <TabsList>
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="shortcut-messages">Shortcut Messages</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="ai-management">AI Management</TabsTrigger>
              <TabsTrigger value="widget-embed">Widget Embed</TabsTrigger>
            </TabsList>
            <TabsContent value="chats" className={styles.tabContent}>
              <div className={styles.chatLayout}>
                <div className={`${styles.chatListPanel} ${selectedChatId ? styles.hiddenOnMobile : ''}`}>
                  <ChatList onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
                </div>
                <div className={`${styles.chatDetailPanel} ${!selectedChatId ? styles.hiddenOnMobile : ''}`}>
                  {selectedChatId ? (
                    <ChatDetail chatId={selectedChatId} onClose={handleCloseChat} />
                  ) : (
                    <div className={styles.noChatSelected}>
                      <p>Select a chat to view the conversation</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="knowledge-base" className={styles.tabContent}>
              <KnowledgeBaseManager />
            </TabsContent>
            <TabsContent value="availability" className={styles.tabContent}>
              <AvailabilityManager />
            </TabsContent>
            <TabsContent value="shortcut-messages" className={styles.tabContent}>
              <ShortcutMessagesManager />
            </TabsContent>
            <TabsContent value="settings" className={styles.tabContent}>
              <SettingsManager />
            </TabsContent>
            <TabsContent value="ai-management" className={styles.tabContent}>
              <AiManagementTab />
            </TabsContent>
            <TabsContent value="widget-embed" className={styles.tabContent}>
              <EmbedScriptGenerator />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default AdminPage;