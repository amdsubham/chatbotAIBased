import { ErrorContext } from "./useErrorHandler";

export const formatErrorContext = (error: ErrorContext): string => {
  const errorTypeMap = {
    javascript: "JavaScript Error",
    promise: "Unhandled Promise Rejection",
    react: "React Component Error",
    manual: "Application Error",
  };

  const typeLabel = errorTypeMap[error.errorType] || "Error";
  
  let formattedContext = `🔴 AUTO-DETECTED ${typeLabel.toUpperCase()}\n\n`;
  formattedContext += `Message: ${error.message}\n\n`;
  formattedContext += `Occurred at: ${new Date(error.timestamp).toLocaleString()}\n\n`;
  
  if (error.source) {
    formattedContext += `File: ${error.source}`;
    if (error.lineno !== undefined) {
      formattedContext += `:${error.lineno}`;
      if (error.colno !== undefined) {
        formattedContext += `:${error.colno}`;
      }
    }
    formattedContext += `\n\n`;
  }
  
  if (error.stack) {
    const stackLines = error.stack.split('\n').slice(0, 5);
    formattedContext += `Stack trace (first 5 lines):\n${stackLines.join('\n')}\n\n`;
  }
  
  if (error.componentStack) {
    const componentLines = error.componentStack.split('\n').slice(0, 3);
    formattedContext += `Component stack:\n${componentLines.join('\n')}\n\n`;
  }
  
  formattedContext += `User Agent: ${error.userAgent}`;
  
  return formattedContext;
};