import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { useSubmitRatingMutation } from "../helpers/useSubmitRatingMutation";
import styles from "./ChatRatingInterface.module.css";

export interface ChatRatingInterfaceProps {
  chatId: number;
  onRatingSubmitted?: () => void;
}

export const ChatRatingInterface = ({ chatId, onRatingSubmitted }: ChatRatingInterfaceProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [showThankYou, setShowThankYou] = useState(false);
  const submitRatingMutation = useSubmitRatingMutation();

  const handleRatingSubmit = async () => {
    if (rating === 0) return;

    try {
      await submitRatingMutation.mutateAsync({
        chatId,
        rating,
        feedbackText: feedbackText.trim() || undefined,
      });
      setShowThankYou(true);
      onRatingSubmitted?.();
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  if (showThankYou) {
    return (
      <div className={styles.thankYouContainer}>
        <div className={styles.thankYouContent}>
          <Star size={32} fill="var(--success)" color="var(--success)" />
          <h3 className={styles.thankYouHeading}>Thank You!</h3>
          <p className={styles.thankYouMessage}>
            We appreciate your feedback and are glad we could help.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ratingContainer}>
      <div className={styles.ratingContent}>
        <h3 className={styles.ratingHeading}>Rate Your Support Experience</h3>
        <div className={styles.starRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={styles.starButton}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={submitRatingMutation.isPending}
            >
              {star <= (hoverRating || rating) ? (
                <Star size={24} fill="currentColor" />
              ) : (
                <Star size={24} />
              )}
            </button>
          ))}
        </div>
        <Textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Tell us more about your experience (optional)"
          rows={3}
          disabled={submitRatingMutation.isPending}
          className={styles.feedbackTextarea}
        />
        <Button
          onClick={handleRatingSubmit}
          disabled={rating === 0 || submitRatingMutation.isPending}
          className={styles.submitRatingButton}
        >
          {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
        </Button>
      </div>
    </div>
  );
};