import React from 'react';
import { User, UserCog } from 'lucide-react';
import { Avatar, AvatarFallback } from './Avatar';
import styles from './TypingIndicator.module.css';

export type TypingIndicatorVariant = 'user' | 'agent';

export interface TypingIndicatorProps {
  /** The name of the person typing. */
  sender: string;
  /** Determines the styling and alignment of the indicator. */
  variant: TypingIndicatorVariant;
  /** Optional additional class names. */
  className?: string;
}

export const TypingIndicator = ({
  sender,
  variant,
  className,
}: TypingIndicatorProps) => {
  const getAvatar = () => {
    switch (variant) {
      case 'user':
        return (
          <Avatar>
            <AvatarFallback>
              <User size={20} />
            </AvatarFallback>
          </Avatar>
        );
      case 'agent':
        return (
          <Avatar>
            <AvatarFallback className={styles.agentAvatar}>
              <UserCog size={20} />
            </AvatarFallback>
          </Avatar>
        );
      default:
        return null;
    }
  };

  const containerClasses = [
    styles.typingRow,
    variant === 'user' ? styles.userRow : styles.agentRow,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {getAvatar()}
      <div className={styles.typingContent}>
        <div className={styles.typingBubble}>
          <div className={styles.typingText}>
            {sender} is typing
          </div>
          <div className={styles.dots}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
};