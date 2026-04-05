import { axios } from "@/lib/axios";
import { User } from "@/types";
import { storeTokens, clearTokens, getRefreshToken } from "@/lib/auth";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await axios.post<AuthResponse>("/auth/login", credentials);

    if (response.data.accessToken && response.data.refreshToken) {
      storeTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data;
  },

  register: async (data: LoginCredentials & { name: string }) => {
    // რეგისტრაცია
    await axios.post("/auth/register", data);

    // ავტომატური ავტორიზაცია
    return authApi.login({
      email: data.email,
      password: data.password,
    });
  },

  getProfile: async () => {
    const response = await axios.get<User>("/auth/profile");
    return response.data;
  },

  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      await axios.post("/auth/logout", { refreshToken });
    } finally {
      clearTokens();
    }
  },
};
