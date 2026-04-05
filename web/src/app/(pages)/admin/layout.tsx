"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api-client";
import { getUserData } from "@/lib/auth";
import { Sidebar } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          console.log("Not authenticated, redirecting to login");
          router.push("/login?redirect=/admin");
          return;
        }

        // Get user data from local storage first
        let userData = getUserData();

        // If no local data or no role, try to fetch from API
        if (!userData || !userData.role) {
          try {
            const response = await apiClient.get("/auth/profile");
            userData = response.data;
            console.log("Fetched user data from API:", userData);
          } catch (error) {
            console.log("Failed to fetch user data from API:", error);
          }
        }

        if (!userData) {
          console.log("No user data found, redirecting to login");
          router.push("/login?redirect=/admin");
          return;
        }

        console.log("Current user role:", userData.role);

        // Check if user has admin role (case-insensitive)
        if (
          userData.role?.toLowerCase() !== "admin" &&
          userData.role?.toLowerCase() !== "seller"
        ) {
          console.log("User doesn't have admin permissions");
          router.push("/");
          return;
        }

        // User is authenticated and authorized
        setAuthorized(true);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/login?redirect=/admin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">იტვირთება...</p>
      </div>
    );
  }

  if (!authorized) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
