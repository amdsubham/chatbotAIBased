import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import styles from './NotificationBadge.module.css';

interface NotificationBadgeProps {
  /**
   * The number of unread notifications to display.
   * The badge is only shown if count > 0.
   */
  count: number;
  /**
   * Callback function invoked when the user clicks the badge to acknowledge notifications.
   */
  onReset: () => void;
  /**
   * Optional className to apply to the container element.
   */
  className?: string;
}

// A simple, short beep sound encoded as a data URL.
const NOTIFICATION_SOUND_URL =
  'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' +
  '9vT19AAAAAP/8/fz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
  '/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+' +
  '/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78' +
'';

export const NotificationBadge = ({
  count,
  onReset,
  className,
}: NotificationBadgeProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(count);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.volume = 0.3;
    }
  }, []);

  useEffect(() => {
    if (count > prevCountRef.current) {
      setIsAnimating(true);
      if (audioRef.current) {
        audioRef.current.play().catch((e) => {
          // Autoplay was prevented, which is common.
          // We can't do much here, but we log it for debugging.
          console.log('Notification sound was blocked by the browser.', e);
        });
      }

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 700); // Corresponds to the animation duration in CSS

      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  const showBadge = count > 0;

  return (
    <button
      onClick={onReset}
      className={`${styles.container} ${className || ''}`}
      aria-label={`Notifications: ${count} unread. Click to clear.`}
      disabled={!showBadge}
    >
      <Bell size={24} />
      {showBadge && (
        <div
          className={`${styles.badge} ${isAnimating ? styles.pulse : ''}`}
          key={count} // Re-trigger animation on count change
        >
          {count > 99 ? '99+' : count}
        </div>
      )}
    </button>
  );
};