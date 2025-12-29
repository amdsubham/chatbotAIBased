import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChats, ChatWithLatestMessage } from '../endpoints/chats_GET.schema';

const LAST_CHECK_TIMESTAMP_KEY = 'lastNotificationCheckTimestamp';

// Simple notification sound as data URL (short pleasant beep)
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCL0fPTgjMGHm7A7+OZUQ4NVqvl77BfGwc9l9r0xHYqBSh+zPLaizsIGGS57OihUQ0PUKXi8LRnHgU2jdXzzn0vBih6yO/ekkILElyx6OyrWRYKQ5zd8sFuJAYthc/z1IY1Bhxqvu7mnFMPDFOo5O+zYh0GOpXY88p5KwUme8rx3I4+CRZftujuq1kWCkKb3PLCcCUGLoXP89WGNQYbaLzs5ptTDwxSp+Tvs2IdBjqU1/PKeSwGJnrJ8dyNPgkWXrXo7qqYFgpBmtzywnAmBi2Ez/PWhjQGGmi76+abUQ8MUqfk77NiHQY6lNbzyngsBSV6yfHcjT4JFl+16O6qmBYKQZnb8sJxJgYthM/z1oYzBhpouuvmm1EODFKm5O+zYhwGOpTV88t4LQUmesjx3Iw+CRVetejuqpcWCkGZ2/LCcSYGLYTP89aGMwYaaLrr5ppRDgxSpuTvs2IcBjmU1vPLeCwFJXnI8dyMPQkVXrXo7qqYFwpBmdvywm8mBi6Ez/PWhTMGGmi66+abUQ4MUaXk77NiHAY5lNXzy3gtBSV5yPHcjD0JFV616O6qmBcKQZnb8sJvJgYuhM/z1oUzBhpouuvmm1EODFGl5O+zYhsGOZPV88t3LAUkecjx3Is9CRVetejuqpcXCkGY2vLCbycGLoTP89aFMwYZaLrr5ptRDgxRpeTvs2IbBjiT1fPLeCwFJHnI8dyLPQkVXrXo7quXFwpBl9rywnAm';

export interface NewMessageInfo {
  chatId: number;
  merchantEmail: string;
  content: string;
}

interface UseNotificationPollingOptions {
  interval?: number;
  enabled?: boolean;
}

export const useNotificationPolling = ({
  interval = 10000, // 10 seconds
  enabled = true,
}: UseNotificationPollingOptions = {}) => {
  const [newMessages, setNewMessages] = useState<NewMessageInfo[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialMount = useRef(true);

  // Initialize audio element
  useEffect(() => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND);
      audio.volume = 0.5; // Set to 50% volume for a pleasant experience
      audioRef.current = audio;
      console.log('Notification sound initialized for polling');
    } catch (error) {
      console.error('Failed to initialize notification sound:', error);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const { data: chats, isSuccess } = useQuery({
    queryKey: ['chats'],
    queryFn: () => getChats(),
    refetchInterval: interval,
    enabled,
  });

  useEffect(() => {
    if (!isSuccess || !chats) {
      return;
    }

    const lastCheckTimestampStr = sessionStorage.getItem(LAST_CHECK_TIMESTAMP_KEY);
    const lastCheckTimestamp = lastCheckTimestampStr ? new Date(lastCheckTimestampStr) : new Date(0);

    const foundNewMessages: NewMessageInfo[] = [];

    chats.forEach((chat: ChatWithLatestMessage) => {
      if (
        chat.latestMessage &&
        chat.latestMessage.sender !== 'admin' &&
        new Date(chat.latestMessage.createdAt) > lastCheckTimestamp
      ) {
        foundNewMessages.push({
          chatId: chat.id,
          merchantEmail: chat.merchantEmail,
          content: chat.latestMessage.content,
        });
      }
    });

    if (foundNewMessages.length > 0) {
      // Add new messages, avoiding duplicates based on chatId and content
      setNewMessages(prevMessages => {
        const existingMessageKeys = new Set(prevMessages.map(m => `${m.chatId}-${m.content}`));
        const uniqueNewMessages = foundNewMessages.filter(
          m => !existingMessageKeys.has(`${m.chatId}-${m.content}`)
        );
        
        // Play sound only if there are truly unique new messages and not on initial mount
        if (uniqueNewMessages.length > 0 && !isInitialMount.current) {
          try {
            if (audioRef.current) {
              // Reset audio to beginning in case it's already playing
              audioRef.current.currentTime = 0;
              const playPromise = audioRef.current.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log(`🔔 Notification sound played for ${uniqueNewMessages.length} new message(s)`);
                  })
                  .catch((error) => {
                    console.log('Notification sound play blocked (may require user interaction):', error);
                  });
              }
            }
          } catch (error) {
            console.error('Error playing notification sound:', error);
          }
        }
        
        return [...prevMessages, ...uniqueNewMessages];
      });
    }

    // Mark initial mount as complete after first check
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [chats, isSuccess]);

  const reset = useCallback(() => {
    setNewMessages([]);
    sessionStorage.setItem(LAST_CHECK_TIMESTAMP_KEY, new Date().toISOString());
    console.log('Notification polling reset and timestamp updated.');
  }, []);

  return {
    newMessages,
    newMessageCount: newMessages.length,
    reset,
  };
};