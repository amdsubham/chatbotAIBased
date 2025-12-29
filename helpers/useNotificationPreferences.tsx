import { useState, useEffect } from "react";

const STORAGE_KEY = "adminNotificationPreferences";

interface NotificationPreferences {
  pollingInterval: number;
  enabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pollingInterval: 10000,
  enabled: true,
};

function loadPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(stored);
    return {
      pollingInterval: typeof parsed.pollingInterval === "number" ? parsed.pollingInterval : DEFAULT_PREFERENCES.pollingInterval,
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_PREFERENCES.enabled,
    };
  } catch (error) {
    console.log("Failed to load notification preferences from localStorage:", error);
    return DEFAULT_PREFERENCES;
  }
}

function savePreferences(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    console.log("Notification preferences saved to localStorage");
  } catch (error) {
    console.log("Failed to save notification preferences to localStorage:", error);
  }
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => loadPreferences());

  // Save to localStorage whenever preferences change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const setPollingInterval = (interval: number) => {
    setPreferences((prev) => ({ ...prev, pollingInterval: interval }));
  };

  const setEnabled = (enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, enabled }));
  };

  return {
    pollingInterval: preferences.pollingInterval,
    pollingEnabled: preferences.enabled,
    setPollingInterval,
    setEnabled,
  };
}