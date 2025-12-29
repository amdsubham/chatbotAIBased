import React, { useState, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import styles from "./ChatMessageInput.module.css";

export interface ChatMessageInputProps {
  onSendMessage: (message: string, imageUrl: string | null) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
}

export const ChatMessageInput = ({ onSendMessage, onTyping, disabled }: ChatMessageInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setImageError('Image size must be less than 5MB');
      return;
    }

    setImageError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage({
        file,
        preview: reader.result as string,
      });
    };
    reader.onerror = () => {
      setImageError('Failed to read image file');
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageError(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (message.trim() === "" && !selectedImage) return;

    const userMessage = message.trim() || "(Image attached)";
    const imageUrl = selectedImage?.preview || null;
    
    setMessage("");
    setSelectedImage(null);
    setImageError(null);
    setIsSending(true);

    try {
      await onSendMessage(userMessage, imageUrl);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.chatInputContainer}>
      {selectedImage && (
        <div className={styles.imagePreview}>
          <img src={selectedImage.preview} alt="Preview" className={styles.previewImage} />
          <div className={styles.previewInfo}>
            <div className={styles.previewFileName}>{selectedImage.file.name}</div>
            <div className={styles.previewFileSize}>{formatFileSize(selectedImage.file.size)}</div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRemoveImage}
            className={styles.removeImageButton}
            type="button"
          >
            <X size={16} />
          </Button>
        </div>
      )}
      {imageError && (
        <div className={styles.imageError}>{imageError}</div>
      )}
      <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className={styles.hiddenFileInput}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleUploadClick}
          disabled={disabled || isSending}
          type="button"
          title="Attach image"
        >
          <Paperclip size={18} />
        </Button>
        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (e.target.value.trim()) {
              onTyping();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className={styles.chatInput}
          rows={1}
          disableResize
          disabled={disabled || isSending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || isSending || (message.trim() === "" && !selectedImage)}
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};