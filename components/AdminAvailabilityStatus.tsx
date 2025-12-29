import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { useIsAdminAvailable } from '../helpers/useIsAdminAvailable';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import styles from './AdminAvailabilityStatus.module.css';

interface AdminAvailabilityStatusProps {
  /**
   * Determines the layout of the component.
   * 'inline': Status and next availability are on the same line.
   * 'block': Status and next availability are stacked vertically.
   * @default 'inline'
   */
  variant?: 'inline' | 'block';
  /**
   * Toggles the display of the next available time slot when offline.
   * @default true
   */
  showNextAvailable?: boolean;
  /**
   * Optional additional CSS classes to apply to the container.
   */
  className?: string;
}

const formatTime = (timeStr: string): string => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((part) => part.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch (error) {
    console.error(`Failed to get abbreviation for timezone: ${timezone}`, error);
    return timezone;
  }
};

export const AdminAvailabilityStatus = ({
  variant = 'inline',
  showNextAvailable = true,
  className,
}: AdminAvailabilityStatusProps) => {
  // This state is used to force a re-render every minute to re-evaluate availability
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000); // Re-check every 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  const { isLoading, isAvailable, nextAvailableSlot } = useIsAdminAvailable();

  const containerClasses = `${styles.container} ${styles[variant]} ${className || ''}`;

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className={styles.badgeContainer}>
          <Skeleton className={styles.skeletonBadge} />
        </div>
        {showNextAvailable && <Skeleton className={styles.skeletonText} />}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={styles.badgeContainer}>
        {isAvailable ? (
          <Badge variant="success">
            <Circle size={12} className={`${styles.icon} ${styles.available}`} />
            Admin Available
          </Badge>
        ) : (
          <Badge variant="outline">
            <Circle size={12} className={`${styles.icon} ${styles.offline}`} />
            Admin Offline
          </Badge>
        )}
      </div>
      {!isAvailable && showNextAvailable && nextAvailableSlot && (
        <p className={styles.nextAvailableText}>
          Next available: {nextAvailableSlot.day} at{' '}
          {formatTime(nextAvailableSlot.startTime)}{' '}
          {getTimezoneAbbreviation(nextAvailableSlot.timezone)}
        </p>
      )}
    </div>
  );
};