import { setupResponseInterceptors } from "./api-client";
import {
  getRefreshToken,
  getAccessToken,
  storeTokens,
  clearTokens,
} from "./auth";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Reset function for cleanup
const resetRefreshState = () => {
  isRefreshing = false;
  failedQueue = [];
};

// Refresh token function
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<boolean>((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => resolve(!!token),
          reject,
        });
      });
    }
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      resetRefreshState();
      return false;
    }

    // Using fetch directly to avoid interceptors
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      }
    );
    const data = await response.json();

    if (data.tokens && data.tokens.accessToken && data.tokens.refreshToken) {
      storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
      processQueue(null, data.tokens.accessToken);
      resetRefreshState();
      return true;
    }

    clearTokens();
    processQueue(new Error("Invalid response format"));
    resetRefreshState();
    return false;
  } catch (error) {
    console.error("Token refresh error:", error);
    clearTokens();
    processQueue(error);
    resetRefreshState();
    return false;
  }
};

// Check and refresh auth if needed
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // If no refresh token, user is not logged in
  if (!refreshToken) {
    return false;
  }

  // If we have a valid (non-expired) access token, user is authenticated
  // No need to refresh unless token is about to expire
  if (accessToken) {
    try {
      // Decode the JWT to check expiration
      const base64Url = accessToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const { exp } = JSON.parse(jsonPayload);

      if (exp) {
        const expirationTime = exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        // If token expires in more than 5 minutes, no need to refresh
        if (timeUntilExpiration > 5 * 60 * 1000) {
          return true; // User is authenticated with valid token
        }
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
      // If we can't decode the token, try to refresh
    }
  }

  // Access token is missing or about to expire, try to refresh
  try {
    const success = await refreshAuthToken();
    return success;
  } catch (error) {
    console.error("Failed to refresh token during init:", error);
    return false;
  }
};

// Setup response interceptors with the refreshAuthToken function
setupResponseInterceptors(async () => {
  await refreshAuthToken();
  return;
});
