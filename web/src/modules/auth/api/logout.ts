import { clearTokens, getAccessToken, getRefreshToken } from "@/lib/auth";

export async function logout() {
  try {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    // Only attempt server logout if we have a token
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }), // Send refresh token to logout only this session
        });
      } catch (error) {
        console.error("Server logout failed:", error);
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Always clear tokens locally
    clearTokens();
  }
}
