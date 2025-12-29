import { ReactNode } from "react";
import styles from "./parseMarkdown.module.css";

/**
 * Parses markdown-style formatting in text and returns React elements
 * Supports:
 * - **text** or ***text*** for bold
 * - *text* for italic
 * - Line breaks are preserved
 * - URLs (http://, https://, www.) converted to clickable links
 */
export const parseMarkdown = (text: string): ReactNode => {
  if (!text) return text;

  // Split by line breaks first to preserve them
  const lines = text.split('\n');
  
  const parsedLines = lines.map((line, lineIndex) => {
    const elements: ReactNode[] = [];
    let currentIndex = 0;
    
    // Regex to match markdown patterns
    // Order matters: check for *** first, then **, then *
    const markdownRegex = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
    
    let match;
    while ((match = markdownRegex.exec(line)) !== null) {
      // Add text before the match (process for URLs)
      if (match.index > currentIndex) {
        const textBefore = line.substring(currentIndex, match.index);
        elements.push(...processUrls(textBefore, lineIndex, currentIndex));
      }
      
      // Determine which pattern matched and add appropriate element
      if (match[1]) {
        // *** bold *** (triple asterisk)
        const boldContent = processUrls(match[2], lineIndex, match.index);
        elements.push(<strong key={`bold-${lineIndex}-${match.index}`}>{boldContent}</strong>);
      } else if (match[3]) {
        // ** bold ** (double asterisk)
        const boldContent = processUrls(match[4], lineIndex, match.index);
        elements.push(<strong key={`bold-${lineIndex}-${match.index}`}>{boldContent}</strong>);
      } else if (match[5]) {
        // * italic * (single asterisk)
        const italicContent = processUrls(match[6], lineIndex, match.index);
        elements.push(<em key={`italic-${lineIndex}-${match.index}`}>{italicContent}</em>);
      }
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last match (process for URLs)
    if (currentIndex < line.length) {
      const textAfter = line.substring(currentIndex);
      elements.push(...processUrls(textAfter, lineIndex, currentIndex));
    }
    
    // If no matches found, process the original line for URLs
    if (elements.length === 0) {
      return processUrls(line, lineIndex, 0);
    }
    
    return elements;
  });
  
  // Join lines with line break elements
  const result: ReactNode[] = [];
  parsedLines.forEach((line, index) => {
    if (Array.isArray(line)) {
      result.push(...line);
    } else {
      result.push(line);
    }
    
    // Add line break if not the last line
    if (index < parsedLines.length - 1) {
      result.push(<br key={`br-${index}`} />);
    }
  });
  
  return result;
};

/**
 * Process URLs in text and convert them to clickable links
 */
function processUrls(text: string, lineIndex: number, offset: number): ReactNode[] {
  const elements: ReactNode[] = [];
  let currentIndex = 0;
  
  // Regex to match URLs
  // Matches http://, https://, and www. URLs
  // Stops at spaces, line breaks, or certain punctuation at the end
  const urlRegex = /(https?:\/\/[^\s<>,\)\]\}'"]+|www\.[^\s<>,\)\]\}'"]+)/g;
  
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > currentIndex) {
      elements.push(text.substring(currentIndex, match.index));
    }
    
    let url = match[1];
    // Clean up trailing punctuation that's likely not part of the URL
    url = url.replace(/[.,;:!?]+$/, '');
    
    // Prepare href - add https:// if URL starts with www.
    let href = url;
    if (url.startsWith('www.')) {
      href = `https://${url}`;
    }
    
    // Create clickable link
    elements.push(
      <a
        key={`link-${lineIndex}-${offset}-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {url}
      </a>
    );
    
    // Adjust currentIndex based on the cleaned URL length
    const cleanedLength = url.length;
    currentIndex = match.index + cleanedLength;
  }
  
  // Add remaining text after last URL
  if (currentIndex < text.length) {
    elements.push(text.substring(currentIndex));
  }
  
  // If no URLs found, return the original text
  if (elements.length === 0) {
    return [text];
  }
  
  return elements;
}