import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
} from "./auth";

export async function fetchWithAuth(url: string, config: RequestInit = {}) {
  const { headers, ...rest } = config;

  if (typeof window === "undefined") {
    throw new Error("fetchWithAuth must be used in client components only");
  }

  const makeRequest = async () => {
    const accessToken = getAccessToken();
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      ...rest,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: "include",
      mode: "cors",
    });
  };
  try {
    let response = await makeRequest();

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      console.log("🔐 Got 401, attempting token refresh for URL:", url);
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        console.error("❌ No refresh token found, logging out");
        clearTokens();
        // Redirect to login instead of reload to avoid infinite loop
        window.location.href = "/login";
        throw new Error("ავტორიზაცია საჭიროა");
      }

      try {
        console.log("🔄 Attempting to refresh token...");
        // Attempt to refresh the token
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (!refreshResponse.ok) {
          console.error(
            "❌ Token refresh failed with status:",
            refreshResponse.status
          );
          clearTokens();
          // Redirect to login instead of reload
          window.location.href = "/login";
          throw new Error("სესია ვადაგასულია, გთხოვთ თავიდან შეხვიდეთ");
        }

        const data = await refreshResponse.json();
        if (data.tokens?.accessToken && data.tokens?.refreshToken) {
          console.log("✅ Token refreshed successfully");
          storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
          // Retry the original request with new token
          response = await makeRequest();
        } else {
          console.error("❌ Invalid token response format");
          clearTokens();
          // Redirect to login instead of reload
          window.location.href = "/login";
          throw new Error("ტოკენის განახლება ვერ მოხერხდა");
        }
      } catch (refreshError) {
        console.error("❌ Token refresh error:", refreshError);
        clearTokens();
        // Redirect to login instead of reload
        window.location.href = "/login";
        if (refreshError instanceof Error) {
          throw refreshError;
        }
        throw new Error("ავტორიზაციის შეცდომა");
      }
    }

    // For 204 No Content, return the response as is
    if (response.status === 204) {
      return response;
    }

    // Handle non-successful responses (not 2xx)
    if (!response.ok) {
      // Try to parse error details from the response
      try {
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error(`[fetchWithAuth] Error response:`, errorData);

          // Special handling for specific error messages
          if (
            typeof errorData.message === "string" &&
            errorData.message.toLowerCase().includes("invalid order") &&
            url.includes("/orders")
          ) {
            // For orders endpoints with this specific error, we'll pass it through
            // without treating it as an error - the component will handle it
            throw new Error("Invalid order ID - user likely has no orders yet");
          }

          if (errorData.message) {
            throw new Error(
              typeof errorData.message === "string"
                ? errorData.message
                : Array.isArray(errorData.message)
                ? errorData.message.join(", ")
                : JSON.stringify(errorData.message)
            );
          } else if (errorData.error) {
            throw new Error(errorData.error);
          }
        } else {
          // Not JSON response
          const textError = await response.text();
          console.error(
            `[fetchWithAuth] Non-JSON error response: ${textError}`
          );
          throw new Error(`შეცდომა: ${response.status} ${response.statusText}`);
        }
      } catch (parseError) {
        console.error(
          `[fetchWithAuth] Failed to parse error response:`,
          parseError
        );
        // If we can't parse the response, use the HTTP status
        throw new Error(`შეცდომა: ${response.status} ${response.statusText}`);
      }

      // Fallback error if we couldn't extract a more specific message
      throw new Error("მოთხოვნის შესრულება ვერ მოხერხდა");
    }

    return response;
  } catch (error) {
    console.error(`[fetchWithAuth] error:`, error);
    // Re-throw the error for handling by the caller
    throw error;
  }
}
