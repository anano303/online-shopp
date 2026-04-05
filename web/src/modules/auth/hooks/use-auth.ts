"use client";

import { useAuth as useGlobalAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import axios, { AxiosError } from "axios";
import { User } from "@/types";

// Define response types
interface AuthResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
  success?: boolean;
  message?: string;
}

// Define registration data types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Logout hook
export function useLogout() {
  const { logout } = useGlobalAuth();

  return {
    mutate: logout,
    logout,
  };
}

// Enhanced error handling function for consistent backend error extraction
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string | string[];
      error?: string;
      statusCode?: number;
    }>;

    // Extract error message from response data
    if (axiosError.response?.data) {
      const { data } = axiosError.response;

      // Handle array of error messages (typically from validation errors)
      if (data.message && Array.isArray(data.message)) {
        return data.message.join(", ");
      }

      // Handle single error message
      if (data.message && typeof data.message === "string") {
        // Map common backend error messages to user-friendly messages
        if (
          data.message.includes("already exists") ||
          data.message.includes("duplicate") ||
          data.message.includes("Failed to create user") ||
          (data.message === "Failed to create user" &&
            axiosError.response.status === 400)
        ) {
          return "ეს ელ-ფოსტა უკვე რეგისტრირებულია";
        }

        if (data.message.includes("invalid email")) {
          return "არასწორი ელ-ფოსტის ფორმატი";
        }

        if (data.message.includes("password")) {
          return "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს";
        }

        return data.message;
      }

      // Handle error field
      if (data.error && typeof data.error === "string") {
        return data.error;
      }
    }

    // Handle specific HTTP status codes
    if (axiosError.response?.status === 400) {
      return "მონაცემები არასწორია. გთხოვთ, შეამოწმოთ შეყვანილი ინფორმაცია.";
    }

    if (axiosError.response?.status === 409) {
      return "ეს ელ-ფოსტა უკვე რეგისტრირებულია";
    }

    // Handle network errors
    if (axiosError.message === "Network Error") {
      return "სერვერთან კავშირი ვერ მოხერხდა. გთხოვთ, შეამოწმოთ ინტერნეტ კავშირი.";
    }

    // Handle timeout errors
    if (axiosError.code === "ECONNABORTED") {
      return "მოთხოვნის დრო ამოიწურა. გთხოვთ, სცადოთ მოგვიანებით.";
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown error types
  return "დაფიქსირდა უცნობი შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.";
}

// Login hook
export function useLogin() {
  const { login, loginStatus, loginError } = useGlobalAuth();

  return {
    mutate: login,
    isLoading: loginStatus === "pending",
    isPending: loginStatus === "pending",
    isError: loginStatus === "error",
    error: loginError,
  };
}

// Register hook
export function useRegister() {
  const mutation = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      try {
        const response = await apiClient.post<AuthResponse>(
          "/auth/register",
          userData
        );
        return response.data;
      } catch (error) {
        const errorMessage = extractErrorMessage(error);
        throw new Error(errorMessage);
      }
    },
  });

  return {
    ...mutation,
    isPending: mutation.status === "pending",
  };
}
