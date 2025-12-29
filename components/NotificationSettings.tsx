import React from 'react';
import { Bell, BellRing, Settings, Info } from 'lucide-react';
import { useNotificationPermission } from '../helpers/useNotificationPermission';
import { Switch } from './Switch';
import { Button } from './Button';
import styles from './NotificationSettings.module.css';

export interface NotificationSettingsProps {
  /** The current polling interval in milliseconds */
  pollingInterval: number;
  /** Callback to change the polling interval */
  onPollingIntervalChange: (interval: number) => void;
  /** Whether polling for notifications is enabled */
  enabled: boolean;
  /** Callback to toggle polling */
  onEnabledChange: (enabled: boolean) => void;
  /** Optional className for custom styling */
  className?: string;
}

const POLLING_OPTIONS = [
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
];

/**
 * A component for configuring notification settings, including enabling/disabling,
 * setting a polling interval, and managing browser notification permissions.
 */
export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  pollingInterval,
  onPollingIntervalChange,
  enabled,
  onEnabledChange,
  className,
}) => {
  const { permission, requestPermission, isSupported } = useNotificationPermission();

  const handleTestNotification = () => {
    if (isSupported && permission === 'granted') {
      new Notification('Test Notification', {
        body: 'If you see this, notifications are working!',
        icon: '/favicon.ico', // Assuming a favicon exists at the root
      });
    } else {
      console.error('Cannot send test notification. Permission not granted or not supported.');
    }
  };

  const getPermissionStatusText = () => {
    switch (permission) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'default':
        return 'Not Granted';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`${styles.panel} ${className ?? ''}`}>
      <header className={styles.header}>
        <Settings size={18} className={styles.headerIcon} />
        <h3 className={styles.title}>Notification Settings</h3>
      </header>

      <div className={styles.content}>
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <Info size={18} className={styles.infoIcon} />
            <span className={styles.infoTitle}>Sound Alerts for iPhone Users</span>
          </div>
          <div className={styles.infoText}>
            <p>
              If you're on an iPhone, sound alerts work perfectly even when browser notifications don't! 
              When a new message arrives, you'll hear a sound automatically—no special permissions needed.
            </p>
            <p>
              <strong>Important:</strong> Just make sure you've opened this admin page at least once. 
              This is an iPhone Safari requirement to enable sound playback.
            </p>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.labelContainer}>
            <label htmlFor="notification-toggle" className={styles.label}>
              Enable Notifications
            </label>
            <p className={styles.description}>
              Get desktop notifications for new messages.
            </p>
          </div>
          <Switch
            id="notification-toggle"
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={permission !== 'granted'}
          />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.labelContainer}>
            <label htmlFor="polling-interval" className={styles.label}>
              Check for new messages
            </label>
            <p className={styles.description}>
              How often to check for new messages.
            </p>
          </div>
          <select
            id="polling-interval"
            value={pollingInterval}
            onChange={(e) => onPollingIntervalChange(Number(e.target.value))}
            className={styles.select}
            disabled={!enabled || permission !== 'granted'}
          >
            {POLLING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.labelContainer}>
            <label className={styles.label}>Browser Permission</label>
            <p className={styles.description}>
              Required to show desktop notifications.
            </p>
          </div>
          <span className={`${styles.status} ${styles[permission]}`}>
            {getPermissionStatusText()}
          </span>
        </div>
      </div>

      <footer className={styles.footer}>
        {isSupported && permission === 'default' && (
          <Button variant="outline" size="sm" onClick={requestPermission}>
            <Bell size={16} />
            Request Permission
          </Button>
        )}
        {isSupported && permission === 'denied' && (
          <p className={styles.deniedMessage}>
            Permissions are blocked. Please enable them in your browser settings.
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTestNotification}
          disabled={!enabled || permission !== 'granted'}
        >
          <BellRing size={16} />
          Send Test
        </Button>
      </footer>
    </div>
  );
};