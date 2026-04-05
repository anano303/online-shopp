import { useEffect } from "react";
import { useAuth } from "./use-auth";
import {
  getAccessToken,
  getRefreshToken,
  getTokenTimeRemaining,
} from "@/lib/auth";

export function useTokenExpiry() {
  const { user } = useAuth();

  useEffect(() => {
    // Only run if user is logged in
    if (!user) return;

    const checkTokenExpiry = () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      // If no tokens at all, user is not logged in
      if (!accessToken && !refreshToken) {
        return;
      }

      // Don't logout here even if access token is expired!
      // The axios interceptor and auth-provider will handle refresh
      // This hook is now only for logging/monitoring purposes

      // Log remaining time for debugging
      const timeRemaining = getTokenTimeRemaining();
      if (timeRemaining > 0) {
        const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));
        console.log(`Access token expires in: ${minutesRemaining} minutes`);
      } else {
        console.log("Access token expired, waiting for refresh...");
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}
