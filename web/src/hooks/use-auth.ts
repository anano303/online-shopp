import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { login as loginApi, LoginData } from "@/modules/auth/api/login";
import { logout as logoutApi } from "@/modules/auth/api/logout";
import { isLoggedIn, getUserData, clearTokens } from "@/lib/auth";

export function useAuth() {
  const queryClient = useQueryClient();

  // Get currently logged in user data
  const {
    data: user,
    isLoading,
    error,
    status,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      // If no token, don't make the request and immediately return null
      if (!isLoggedIn()) {
        return null;
      }

      try {
        const response = await apiClient.get("/auth/profile");
        return response.data;
      } catch (error) {
        console.error("Error fetching user profile:", error);

        // Don't clear tokens here - let the axios interceptor handle 401 and refresh
        // The interceptor will redirect to login if refresh also fails
        // If we get here after a 401, it means refresh failed and we're already being redirected

        // Return locally stored user data as fallback
        const localUserData = getUserData();
        return localUserData;
      }
    },
    initialData: () => {
      // Only use initial data if we have a token
      return isLoggedIn() ? getUserData() : null;
    },
    retry: 1,
    retryDelay: 1000,
    // Set a stale time to prevent excessive refetching
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const result = await loginApi(data);

      // If login API returns success: false, throw an error to trigger onError
      if (!result.success) {
        throw new Error(result.error || "ავტორიზაცია ვერ მოხერხდა");
      }

      return result;
    },
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Store profile image in localStorage
        if (data.user.profileImage) {
          localStorage.setItem("userProfileImage", data.user.profileImage);
        }
        // Update the user query with the new user data
        queryClient.setQueryData(["user"], data.user);
        // Invalidate and refetch to ensure we have the latest data
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    },
    onError: (error) => {
      console.error("Login error in mutation:", error);
      // Error will be available via loginMutation.error
    },
  });
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      // Clear all query cache
      queryClient.clear();
      queryClient.setQueryData(["user"], null);

      // Clear all local storage and session storage
      clearTokens();

      // Force a full page refresh to reset all state
      window.location.href = "/login";
    },
    onError: () => {
      // Even if logout API fails, clear local state
      queryClient.clear();
      queryClient.setQueryData(["user"], null);
      clearTokens();
      window.location.href = "/login";
    },
  });

  return {
    user,
    isLoading,
    error,
    status,
    isLoggedIn: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    loginStatus: loginMutation.status,
    logoutStatus: logoutMutation.status,
    loginError: loginMutation.error,
  };
}
