import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// საჯარო მარშრუტები, რომლებიც არ საჭიროებენ ავტორიზაციას
const publicRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/sellers-register",
  "/auth/refresh",
  "/login",
  "/register",
  "/sellers-register",
  "/",
  "forgot-password",
  "reset-password",
  "products",
  "product/:id",
];

// Token refresh state
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

// მარტივი რექვესთ ინტერცეპტორი
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tsamerti_access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Check if it's a 401 error
    if (error.response?.status === 401) {
      // Skip refresh for auth endpoints (except profile)
      const isAuthEndpoint =
        originalRequest.url?.includes("/auth/") &&
        !originalRequest.url?.includes("/auth/profile");

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // Check if it's a public route
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const isPublicRoute = publicRoutes.some(
        (route) =>
          currentPath.includes(route) || originalRequest.url?.includes(route)
      );

      if (isPublicRoute) {
        return Promise.reject(error);
      }

      // Don't retry if already retried
      if (originalRequest._retry) {
        // Clear tokens and redirect to login
        localStorage.removeItem("tsamerti_access_token");
        localStorage.removeItem("tsamerti_refresh_token");
        localStorage.removeItem("tsamerti_user_data");
        // Clear cookies
        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie =
          "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("tsamerti_refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Use fetch to avoid interceptor loops
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

        if (!response.ok) {
          throw new Error("Refresh failed");
        }

        const data = await response.json();

        if (data.tokens?.accessToken && data.tokens?.refreshToken) {
          // Store new tokens
          localStorage.setItem(
            "tsamerti_access_token",
            data.tokens.accessToken
          );
          localStorage.setItem(
            "tsamerti_refresh_token",
            data.tokens.refreshToken
          );

          // Update cookies
          document.cookie = `access_token=${
            data.tokens.accessToken
          }; path=/; max-age=${30 * 24 * 60 * 60}`;
          document.cookie = `refresh_token=${
            data.tokens.refreshToken
          }; path=/; max-age=${30 * 24 * 60 * 60}`;

          // Process queued requests
          processQueue(null, data.tokens.accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error("Invalid token response");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear all tokens
        localStorage.removeItem("tsamerti_access_token");
        localStorage.removeItem("tsamerti_refresh_token");
        localStorage.removeItem("tsamerti_user_data");
        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie =
          "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";

        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { axiosInstance as axios };
