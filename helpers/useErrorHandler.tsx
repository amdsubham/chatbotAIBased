import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

/**
 * Defines the structure for a captured error context.
 */
export type ErrorContext = {
  message: string;
  stack?: string;
  source?: string; // filename
  lineno?: number;
  colno?: number;
  timestamp: string; // ISO string
  errorType: "javascript" | "promise" | "react" | "manual";
  userAgent: string;
  componentStack?: string;
};

type ErrorHandlerContextType = {
  latestError: ErrorContext | null;
  hasUnhandledError: boolean;
  reportError: (
    error: unknown,
    type: ErrorContext["errorType"],
    info?: { componentStack?: string },
  ) => void;
  clearError: () => void;
};

const ErrorHandlerContext = createContext<ErrorHandlerContextType | undefined>(
  undefined,
);

/**
 * A singleton-like store to hold the latest error, allowing access
 * from outside the React component tree.
 */
const errorStore: { current: ErrorContext | null } = {
  current: null,
};

/**
 * A non-React function to get the latest captured error.
 * Useful for logic outside of components, e.g., when initializing a chat session.
 * @returns The latest ErrorContext object or null if none exists.
 */
export const getLatestError = (): ErrorContext | null => {
  return errorStore.current;
};

/**
 * A React hook to access the global error handling state and functions.
 * Must be used within an ErrorHandlerProvider.
 * @returns An object with the latest error, a boolean indicating if an error exists,
 *          a function to report errors manually, and a function to clear the current error.
 */
export const useErrorHandler = (): ErrorHandlerContextType => {
  const context = useContext(ErrorHandlerContext);
  if (context === undefined) {
    throw new Error("useErrorHandler must be used within an ErrorHandlerProvider");
  }
  return context;
};

// --- React Error Boundary Component ---

interface ErrorBoundaryProps {
  children: ReactNode;
  onCatch: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onCatch(error, errorInfo);
  }

  render() {
    // We don't render a fallback UI here because the goal is not to replace
    // the broken component, but to report the error and let the app continue
    // if possible. The ChatWidget can then be triggered.
    // If a fallback is desired, it would be implemented here.
    // For now, we render children even if there's an error, to avoid a blank screen.
    // React will have unmounted the crashing part of the tree.
    return this.props.children;
  }
}

// --- Error Handler Provider Component ---

/**
 * Provider component that sets up global error listeners and a React Error Boundary.
 * This should wrap the entire application, ideally near the root.
 */
export const ErrorHandlerProvider = ({ children }: { children: ReactNode }) => {
  const [latestError, setLatestError] = useState<ErrorContext | null>(null);

  const reportError = useCallback(
    (
      error: unknown,
      type: ErrorContext["errorType"],
      info?: { componentStack?: string },
    ) => {
      console.error(`[GlobalErrorHandler] Caught an error of type: ${type}`, {
        error,
        info,
      });

      let formattedError: ErrorContext;

      if (error instanceof Error) {
        formattedError = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          errorType: type,
          userAgent: navigator.userAgent,
          componentStack: info?.componentStack,
        };
      } else {
        formattedError = {
          message: String(error),
          timestamp: new Date().toISOString(),
          errorType: type,
          userAgent: navigator.userAgent,
          componentStack: info?.componentStack,
        };
      }

      setLatestError(formattedError);
      errorStore.current = formattedError;
    },
    [],
  );

  const clearError = useCallback(() => {
    setLatestError(null);
    errorStore.current = null;
  }, []);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const { message, filename, lineno, colno, error } = event;
      const newError: ErrorContext = {
        message,
        source: filename,
        lineno,
        colno,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        errorType: "javascript",
        userAgent: navigator.userAgent,
      };
      setLatestError(newError);
      errorStore.current = newError;
      console.error("[GlobalErrorHandler] Uncaught JavaScript Error:", event);
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      let newError: ErrorContext;
      if (reason instanceof Error) {
        newError = {
          message: reason.message,
          stack: reason.stack,
          timestamp: new Date().toISOString(),
          errorType: "promise",
          userAgent: navigator.userAgent,
        };
      } else {
        newError = {
          message: String(reason),
          timestamp: new Date().toISOString(),
          errorType: "promise",
          userAgent: navigator.userAgent,
        };
      }
      setLatestError(newError);
      errorStore.current = newError;
      console.error(
        "[GlobalErrorHandler] Unhandled Promise Rejection:",
        event,
      );
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handlePromiseRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handlePromiseRejection);
    };
  }, []);

  const handleReactError = useCallback(
    (error: Error, info: React.ErrorInfo) => {
            reportError(error, "react", { componentStack: info.componentStack ?? undefined });
    },
    [reportError],
  );

  const contextValue: ErrorHandlerContextType = {
    latestError,
    hasUnhandledError: latestError !== null,
    reportError,
    clearError,
  };

  return (
    <ErrorHandlerContext.Provider value={contextValue}>
      <ErrorBoundary onCatch={handleReactError}>{children}</ErrorBoundary>
    </ErrorHandlerContext.Provider>
  );
};