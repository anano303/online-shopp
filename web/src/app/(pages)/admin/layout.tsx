"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api-client";
import { getUserData } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import "./admin-layout.css";

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
        if (!isAuthenticated()) {
          router.push("/login?redirect=/admin");
          return;
        }

        let userData = getUserData();

        if (!userData || !userData.role) {
          try {
            const response = await apiClient.get("/auth/profile");
            userData = response.data;
          } catch (error) {
            console.log("Failed to fetch user data from API:", error);
          }
        }

        if (!userData) {
          router.push("/login?redirect=/admin");
          return;
        }

        if (
          userData.role?.toLowerCase() !== "admin" &&
          userData.role?.toLowerCase() !== "seller"
        ) {
          router.push("/");
          return;
        }

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
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <p>იტვირთება...</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="admin-wrapper">
      {children}
    </div>
  );
}
