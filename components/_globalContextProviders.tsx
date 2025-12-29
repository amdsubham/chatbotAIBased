import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./Tooltip";
import { SonnerToaster } from "./SonnerToaster";
import { ScrollToHashElement } from "./ScrollToHashElement";
import { ErrorHandlerProvider } from "../helpers/useErrorHandler";
// import { useUnreadMessageReminderPolling } from "../helpers/useUnreadMessageReminderPolling";
import { AuthProvider } from "../helpers/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute "fresh" window
    },
  },
});

const BackgroundPolling = () => {
  // TEMPORARILY DISABLED: Unread message reminder polling
  // This feature is disabled due to Brevo IP security issues.
  // Serverless function IP rotation is triggering hundreds of "Verify a new IP" emails.
  // Re-enable once IPs are whitelisted in Brevo or a different email provider is used.
  // useUnreadMessageReminderPolling();
  console.warn('⚠️ Unread message reminder polling is temporarily disabled due to Brevo IP security alerts');
  return null;
};

export const GlobalContextProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <ErrorHandlerProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BackgroundPolling />
          <ScrollToHashElement />
          <TooltipProvider>
            {children}
            <SonnerToaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorHandlerProvider>
  );
};